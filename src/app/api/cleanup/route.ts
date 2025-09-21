import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Helper function to check if user is admin
async function checkAdminStatus(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

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

// POST /api/cleanup - Clean up expired reservations (admin only)
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

    const { error } = await supabase.rpc("cleanup_expired_reservations");

    if (error) {
      console.error("Error cleaning up expired reservations:", error);
      return NextResponse.json(
        { error: "Failed to cleanup expired reservations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Expired reservations cleaned up successfully",
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
