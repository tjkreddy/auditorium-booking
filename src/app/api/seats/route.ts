import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/seats?showId=123 - Get seats for a specific show
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showId = searchParams.get("showId");

    if (!showId) {
      return NextResponse.json(
        { error: "showId parameter is required" },
        { status: 400 }
      );
    }

    // Clean up expired reservations before fetching seats
    const now = new Date().toISOString();
    await supabaseAdmin
      .from("seats")
      .update({
        status: "available",
        user_id: null,
        reserved_at: null,
        expires_at: null,
      })
      .eq("status", "reserved")
      .lt("expires_at", now);

    const { data: seats, error } = await supabaseAdmin
      .from("seats")
      .select("*")
      .eq("show_id", showId)
      .order("row", { ascending: true })
      .order("number", { ascending: true });

    if (error) {
      console.error("Error fetching seats:", error);
      return NextResponse.json(
        { error: "Failed to fetch seats" },
        { status: 500 }
      );
    }

    return NextResponse.json(seats);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/seats/reserve - Reserve seats temporarily
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seatIds, userId } = body;

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json(
        { error: "seatIds array is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Calculate expiry time (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    // First, clean up any expired reservations
    await supabaseAdmin
      .from("seats")
      .update({
        status: "available",
        user_id: null,
        reserved_at: null,
        expires_at: null,
      })
      .eq("status", "reserved")
      .lt("expires_at", now);

    // Check current status of requested seats before attempting reservation
    const { data: currentSeats } = await supabaseAdmin
      .from("seats")
      .select("id, status, user_id, reserved_at, expires_at")
      .in("id", seatIds);

    console.log("Requested seat IDs:", seatIds);
    console.log("Current seat statuses:", currentSeats);

    // Update seats to reserved status (only available seats after cleanup)
    const { data: seats, error } = await supabaseAdmin
      .from("seats")
      .update({
        status: "reserved",
        user_id: userId,
        reserved_at: now,
        expires_at: expiresAt,
      })
      .in("id", seatIds)
      .eq("status", "available") // Only available seats
      .select("*");

    console.log("Update result:", { seats, error, seatIds });

    if (error) {
      console.error("Error reserving seats:", error);
      return NextResponse.json(
        { error: "Failed to reserve seats" },
        { status: 500 }
      );
    }

    if (seats.length !== seatIds.length) {
      // Some seats were not available
      console.log("Reservation failed:");
      console.log("- Requested seats:", seatIds.length);
      console.log("- Reserved seats:", seats.length);
      console.log(
        "- Reserved seat IDs:",
        seats.map((s) => s.id)
      );
      console.log(
        "- Failed seat IDs:",
        seatIds.filter((id) => !seats.find((s) => s.id === id))
      );

      return NextResponse.json(
        {
          error: "Some seats are no longer available",
          reservedSeats: seats,
          totalRequested: seatIds.length,
          totalReserved: seats.length,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: "Seats reserved successfully",
      seats: seats,
      expiresAt: expiresAt,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
