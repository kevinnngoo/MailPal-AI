"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../../../supabase/client";
import { Loader, CheckCircle, AlertTriangle } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connecting your Gmail account...");

  const supabase = createClient();

  useEffect(() => {
    handleGmailCallback();
  }, []);

  const handleGmailCallback = async () => {
    try {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        throw new Error(`Gmail OAuth error: ${error}`);
      }

      if (!code || !state) {
        throw new Error("Missing authorization code or state parameter");
      }

      // Get current user session
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        // Redirect to login if no user
        router.push("/login?message=Please sign in first");
        return;
      }

      // Verify state matches current user for security
      if (state !== user.id) {
        throw new Error("Security check failed - invalid state parameter");
      }

      setMessage("Exchanging authorization code...");

      // Exchange the authorization code for tokens
      const response = await fetch("/api/gmail/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          state,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to connect Gmail account");
      }

      setMessage("Gmail account connected successfully!");
      setStatus("success");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Gmail callback error:", error);
      setMessage(error instanceof Error ? error.message : "Failed to connect Gmail account");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Setting up your account</h2>
            <p className="text-gray-600">{message}</p>
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                This may take a few moments. Please don't close this window.
              </p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-green-700">
                Your Gmail account is now connected securely. You can start cleaning your inbox!
              </p>
            </div>
            <p className="text-sm text-gray-500">Redirecting you to the dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="bg-red-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-red-700">
                Don't worry, this happens sometimes. You can try connecting again.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full text-gray-600 hover:text-gray-800 px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Back to Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
