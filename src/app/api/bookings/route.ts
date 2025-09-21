import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/bookings - Get user's bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    const { data: bookings, error } = await supabaseAdmin
      .from("bookings")
      .select(
        `
        *,
        show:shows(*),
        seat:seats(*)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, seatIds } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json(
        { error: "seatIds array is required" },
        { status: 400 }
      );
    }

    // Start a transaction-like operation
    // First, verify all seats are still reserved by this user
    const { data: seats, error: seatsError } = await supabaseAdmin
      .from("seats")
      .select("id, show_id, price, status, user_id")
      .in("id", seatIds);

    if (seatsError) {
      console.error("Error fetching seats:", seatsError);
      return NextResponse.json(
        { error: "Failed to verify seats" },
        { status: 500 }
      );
    }

    // Verify all requested seats were found
    if (!seats || seats.length !== seatIds.length) {
      return NextResponse.json(
        { error: "Some seats were not found" },
        { status: 404 }
      );
    }

    // Validate that all seats belong to the same show
    const showIds = [...new Set(seats.map((seat) => seat.show_id))];
    if (showIds.length > 1) {
      return NextResponse.json(
        { error: "All seats must belong to the same show" },
        { status: 400 }
      );
    }

    // Check if all seats are valid and reserved by this user
    const invalidSeats = seats.filter(
      (seat) => seat.status !== "reserved" || seat.user_id !== userId
    );

    if (invalidSeats.length > 0) {
      return NextResponse.json(
        {
          error: "Some seats are no longer available or not reserved by you",
          invalidSeats: invalidSeats,
        },
        { status: 409 }
      );
    }

    // Calculate total amount
    const totalAmount = seats.reduce((sum, seat) => sum + (seat.price || 0), 0);

    // Get the show ID (assuming all seats are from the same show)
    const showId = seats[0].show_id;

    // Create bookings for each seat
    const bookingInserts = seatIds.map((seatId) => ({
      user_id: userId,
      show_id: showId,
      seat_id: seatId,
      total_amount: seats.find((s) => s.id === seatId)?.price || 0,
    }));

    const { data: bookings, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert(bookingInserts)
      .select();

    if (bookingError) {
      console.error("Error creating bookings:", bookingError);
      return NextResponse.json(
        { error: "Failed to create bookings" },
        { status: 500 }
      );
    }

    // Update seats to booked status
    const { error: updateError } = await supabaseAdmin
      .from("seats")
      .update({
        status: "booked",
        booked_at: new Date().toISOString(),
        reserved_at: null,
        expires_at: null,
      })
      .in("id", seatIds);

    if (updateError) {
      console.error("Error updating seat status:", updateError);
      // Note: Bookings were created but seats might still be in reserved status
      // This should be handled by a cleanup process
    }

    return NextResponse.json(
      {
        message: "Booking confirmed successfully",
        bookings: bookings,
        totalAmount: totalAmount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
