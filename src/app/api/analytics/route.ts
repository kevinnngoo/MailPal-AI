import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { event, properties = {} } = body;

    if (!event) {
      return NextResponse.json({ error: "Event name is required" }, { status: 400 });
    }

    // Log analytics event to database
    const { error } = await supabase.from("webhook_events").insert({
      event_type: event,
      type: "analytics",
      data: {
        user_id: user.id,
        timestamp: new Date().toISOString(),
        properties,
        user_agent: req.headers.get("user-agent"),
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      },
    });

    if (error) {
      console.error("Analytics logging error:", error);
      return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get analytics data for the user
    const { data: events, error } = await supabase
      .from("webhook_events")
      .select("*")
      .eq("type", "analytics")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Analytics fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }

    // Process and aggregate the data
    const analytics = {
      total_events: events?.length || 0,
      unique_sessions: new Set(events?.map((e) => e.data?.user_id)).size,
      top_events: events?.reduce((acc: any, event) => {
        const eventType = event.event_type;
        acc[eventType] = (acc[eventType] || 0) + 1;
        return acc;
      }, {}),
      daily_activity: events?.reduce((acc: any, event) => {
        const date = new Date(event.created_at).toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
