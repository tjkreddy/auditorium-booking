import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Helper function to check if user is admin
async function checkAdminStatus(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return false;
    }

    const token = authHeader.substring(7);

    // Verify the token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return false;
    }

    // Check if user has mahindrauniversity.edu.in email (admin domain)
    return user.email?.endsWith("@mahindrauniversity.edu.in") || false;
  } catch (error) {
    console.error("Admin check error:", error);
    return false;
  }
}

// GET /api/shows - Get all shows
export async function GET() {
  try {
    const { data: shows, error } = await supabaseAdmin
      .from("shows")
      .select("*")
      .order("show_date", { ascending: true });

    if (error) {
      console.error("Error fetching shows:", error);
      return NextResponse.json(
        { error: "Failed to fetch shows" },
        { status: 500 }
      );
    }

    return NextResponse.json(shows);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/shows - Create a new show (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await checkAdminStatus(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, show_date, show_time, duration, venue } = body;

    // Validate required fields
    if (!title || !show_date || !show_time || !duration || !venue) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert the show
    const { data: show, error: showError } = await supabaseAdmin
      .from("shows")
      .insert({
        title,
        description,
        show_date,
        show_time,
        duration,
        venue,
      })
      .select()
      .single();

    if (showError) {
      console.error("Error creating show:", showError);
      return NextResponse.json(
        { error: "Failed to create show" },
        { status: 500 }
      );
    }

    // Initialize seats for the show
    const { error: seatsError } = await supabaseAdmin.rpc(
      "initialize_show_seats",
      {
        p_show_id: show.id,
      }
    );

    if (seatsError) {
      console.error("Error initializing seats:", seatsError);
      // Don't fail the request if seat initialization fails, but log it
    }

    return NextResponse.json(show, { status: 201 });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
