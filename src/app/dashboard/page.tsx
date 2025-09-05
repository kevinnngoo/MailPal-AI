// app/dashboard/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "../../../supabase/client";
import { useRouter } from "next/navigation";
import {
  Mail,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader,
  Settings,
  BarChart3,
  X,
  Plus,
  User,
  LogOut,
  Crown,
} from "lucide-react";

interface EmailData {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  category: "promotional" | "social" | "updates" | "forums" | "primary";
  priority: "high" | "medium" | "low";
  isNewsletter: boolean;
  isDeletable: boolean;
  unsubscribeLink?: string;
}

interface ScanSummary {
  total: number;
  promotional: number;
  newsletters: number;
  deletable: number;
}

interface Usage {
  today: number;
  limit: number;
  remaining: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null);
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<"unsubscribe" | "delete">("unsubscribe");
  const [filter, setFilter] = useState<"all" | "promotional" | "newsletters" | "deletable">("all");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      // Check if user is authenticated
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
        return;
      }

      setUser(user);
      await checkGmailConnection();
    } catch (error) {
      console.error("Dashboard initialization error:", error);
      router.push("/login");
    }
  };

  const checkGmailConnection = async () => {
    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("gmail_connected_at")
        .eq("user_id", user?.id)
        .single();

      setIsGmailConnected(!!profile?.gmail_connected_at);
    } catch (error) {
      console.error("Failed to check Gmail connection:", error);
      setIsGmailConnected(false);
    }
  };

  const connectGmail = async () => {
    try {
      const response = await fetch("/api/gmail/auth");
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert("Failed to generate authorization URL");
      }
    } catch (error) {
      console.error("Failed to initiate Gmail connection:", error);
      alert("Failed to connect to Gmail. Please try again.");
    }
  };

  const scanEmails = async () => {
    setIsScanning(true);
    try {
      const response = await fetch("/api/gmail/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ maxResults: 50 }),
      });

      const data = await response.json();

      if (data.upgradeRequired) {
        setShowUpgradePrompt(true);
        return;
      }

      if (data.connectRequired) {
        setIsGmailConnected(false);
        return;
      }

      if (data.success) {
        setEmails(data.emails);
        setScanSummary(data.summary);
        setUsage(data.usage);
        setSelectedEmails(new Set());
      } else {
        alert("Failed to scan emails: " + data.error);
      }
    } catch (error) {
      console.error("Scan failed:", error);
      alert("Failed to scan emails. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectEmail = (emailId: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      const filteredEmails = getFilteredEmails();
      setSelectedEmails(new Set(filteredEmails.map((email) => email.id)));
    } else {
      setSelectedEmails(new Set());
    }
  };

  const handleBulkAction = (type: "unsubscribe" | "delete") => {
    if (selectedEmails.size === 0) return;

    setActionType(type);
    setShowConfirmDialog(true);
  };

  const executeBulkAction = async () => {
    setIsProcessing(true);
    setShowConfirmDialog(false);

    try {
      const endpoint =
        actionType === "unsubscribe" ? "/api/gmail/unsubscribe" : "/api/gmail/delete";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailIds: Array.from(selectedEmails),
          confirmDangerous: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove processed emails from the list
        setEmails((prev) => prev.filter((email) => !selectedEmails.has(email.id)));
        setSelectedEmails(new Set());

        // Show success message
        alert(`✅ ${data.message}`);

        // Refresh usage stats
        await scanEmails();
      } else {
        alert("❌ Action failed: " + data.error);
      }
    } catch (error) {
      console.error("Bulk action failed:", error);
      alert("❌ Action failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getFilteredEmails = () => {
    switch (filter) {
      case "promotional":
        return emails.filter((email) => email.category === "promotional");
      case "newsletters":
        return emails.filter((email) => email.isNewsletter);
      case "deletable":
        return emails.filter((email) => email.isDeletable);
      default:
        return emails;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "promotional":
        return "🛒";
      case "social":
        return "👥";
      case "updates":
        return "📬";
      case "forums":
        return "💬";
      default:
        return "📧";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isGmailConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-900">MailPal AI</h1>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <User className="h-4 w-4" />
                <span>{user.email}</span>
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Connect Gmail */}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full text-center">
            <Mail className="mx-auto h-16 w-16 text-blue-500 mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Connect Your Gmail Account</h2>
            <p className="text-lg text-gray-600 mb-8">
              To start cleaning your inbox, we need secure access to your Gmail account.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8 text-sm">
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <Shield className="h-8 w-8 text-green-500 mb-2" />
                <h3 className="font-semibold mb-1">Secure OAuth2</h3>
                <p className="text-gray-600">Industry-standard authentication</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-blue-500 mb-2" />
                <h3 className="font-semibold mb-1">Read-Only Scanning</h3>
                <p className="text-gray-600">We only read promotional emails</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-orange-500 mb-2" />
                <h3 className="font-semibold mb-1">Smart Protection</h3>
                <p className="text-gray-600">Built-in safety for important emails</p>
              </div>
            </div>

            <button
              onClick={connectGmail}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center space-x-2"
            >
              <Mail className="h-5 w-5" />
              <span>Connect Gmail Account</span>
            </button>

            <p className="text-sm text-gray-500 mt-4">
              You can disconnect at any time from your account settings
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredEmails = getFilteredEmails();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">MailPal AI</h1>
              {usage && (
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {usage.remaining} scans remaining today
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={scanEmails}
                disabled={isScanning}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                {isScanning ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                <span>{isScanning ? "Scanning..." : "Scan Inbox"}</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg transition-colors"
              >
                <User className="h-4 w-4" />
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Summary Cards */}
        {scanSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Found</p>
                  <p className="text-2xl font-bold text-gray-900">{scanSummary.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="text-2xl">🛒</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Promotional</p>
                  <p className="text-2xl font-bold text-gray-900">{scanSummary.promotional}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="text-2xl">📬</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Newsletters</p>
                  <p className="text-2xl font-bold text-gray-900">{scanSummary.newsletters}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Safe to Clean</p>
                  <p className="text-2xl font-bold text-gray-900">{scanSummary.deletable}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        {emails.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
              <div className="flex space-x-2">
                {["all", "promotional", "newsletters", "deletable"].map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType as any)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === filterType
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
                    }`}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      selectedEmails.size === filteredEmails.length && filteredEmails.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">
                    Select All ({selectedEmails.size} selected)
                  </span>
                </label>

                {selectedEmails.size > 0 && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleBulkAction("unsubscribe")}
                      disabled={isProcessing}
                      className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1"
                    >
                      <X className="h-4 w-4" />
                      <span>Unsubscribe ({selectedEmails.size})</span>
                    </button>
                    <button
                      onClick={() => handleBulkAction("delete")}
                      disabled={isProcessing}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete ({selectedEmails.size})</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Email List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredEmails.length === 0 && !isScanning ? (
            <div className="p-12 text-center">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No emails found</h3>
              <p className="text-gray-600">
                {emails.length === 0
                  ? "Click 'Scan Inbox' to find promotional emails and newsletters."
                  : "No emails match the current filter."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredEmails.map((email) => (
                <div key={email.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedEmails.has(email.id)}
                      onChange={() => handleSelectEmail(email.id)}
                      className="mt-1 rounded border-gray-300"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getCategoryIcon(email.category)}</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(email.priority)}`}
                        >
                          {email.priority}
                        </span>
                        {email.isNewsletter && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                            Newsletter
                          </span>
                        )}
                        {!email.isDeletable && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                            Protected
                          </span>
                        )}
                      </div>

                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 pr-4">
                          {email.subject}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(email.date).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-1 truncate">{email.from}</p>
                      <p className="text-sm text-gray-500 line-clamp-2">{email.snippet}</p>

                      {email.unsubscribeLink && (
                        <div className="mt-2 flex items-center space-x-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Unsubscribe link available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm {actionType === "unsubscribe" ? "Unsubscribe" : "Delete"}
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to {actionType} {selectedEmails.size} email(s)?
                {actionType === "delete" && " This action cannot be undone."}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeBulkAction}
                  className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                    actionType === "unsubscribe"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {actionType === "unsubscribe" ? "Unsubscribe" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Prompt */}
        {showUpgradePrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="text-center">
                <Crown className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Limit Reached</h3>
                <p className="text-gray-600 mb-6">
                  You've scanned your daily limit of 25 emails. Upgrade to Premium for unlimited
                  scanning and advanced features.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUpgradePrompt(false)}
                    className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={() => router.push("/#pricing")}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <Loader className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-600">Processing your request...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
