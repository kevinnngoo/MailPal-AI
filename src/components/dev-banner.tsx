"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./ui/button";

export default function DevBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const detectedIssues: string[] = [];

    // Check for default/exposed secrets
    const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (stripeKey && stripeKey.includes("pk_test_")) {
      detectedIssues.push("Using test Stripe keys - remember to rotate for production");
    }

    // Check for missing environment variables
    const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);
    if (missingVars.length > 0) {
      detectedIssues.push(`Missing environment variables: ${missingVars.join(", ")}`);
    }

    // Check for default database URLs
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && supabaseUrl.includes("localhost")) {
      detectedIssues.push("Using local Supabase instance");
    }

    if (detectedIssues.length > 0) {
      setIssues(detectedIssues);
      setIsVisible(true);
    }
  }, []);

  if (!isVisible || process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Development Mode - Security Reminders
            </p>
            <ul className="text-xs text-yellow-700 mt-1">
              {issues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="text-yellow-600 hover:text-yellow-800"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
