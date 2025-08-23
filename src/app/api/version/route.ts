import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";

export async function GET() {
  return NextResponse.json({
    version: packageJson.version || "1.0.0",
    name: packageJson.name || "CleanInbox",
    description: "Email Cleanup Assistant",
    timestamp: new Date().toISOString(),
    node_version: process.version,
    environment: process.env.NODE_ENV || "development",
  });
}
