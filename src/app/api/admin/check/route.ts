import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/admin/check - Check if current user is admin
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // For now, check if email ends with mahindrauniversity.edu.in
    // TODO: Replace with proper role-based check when role field is added
    const isAdmin = user.email?.endsWith("@mahindrauniversity.edu.in") || false;

    return NextResponse.json({ isAdmin, user });
  } catch (error) {
    console.error("Admin check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}