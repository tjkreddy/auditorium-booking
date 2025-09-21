import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

    const { data: seats, error } = await supabase
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

    // Update seats to reserved status
    const { data: seats, error } = await supabase
      .from("seats")
      .update({
        status: "reserved",
        user_id: userId,
        reserved_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .in("id", seatIds)
      .eq("status", "available") // Only reserve if currently available
      .select();

    if (error) {
      console.error("Error reserving seats:", error);
      return NextResponse.json(
        { error: "Failed to reserve seats" },
        { status: 500 }
      );
    }

    if (seats.length !== seatIds.length) {
      // Some seats were not available
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
