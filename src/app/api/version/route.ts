import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "1.0.0",
    name: "MailPal-AI",
    description: "Email Cleanup Assistant",
    timestamp: new Date().toISOString(),
    node_version: process.version,
    environment: process.env.NODE_ENV || "development",
  });
}
