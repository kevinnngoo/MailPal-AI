import { NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Test database connection
    const { data, error } = await supabase.from("users").select("count").limit(1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
      version: process.env.npm_package_version || "unknown",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        database: "disconnected",
      },
      { status: 503 }
    );
  }
}
