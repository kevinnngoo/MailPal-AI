import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../supabase/server";
import {
  InfoIcon,
  UserCircle,
  Mail,
  Trash2,
  Calendar,
  BarChart3,
  Plus,
  Play,
  Settings,
} from "lucide-react";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data for demonstration
const mockCleanupJobs = [
  {
    id: "1",
    type: "Subscription Cleanup",
    status: "completed",
    emailsProcessed: 1247,
    emailsDeleted: 89,
    emailsUnsubscribed: 23,
    completedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    type: "Promotional Cleanup",
    status: "running",
    emailsProcessed: 456,
    emailsDeleted: 34,
    emailsUnsubscribed: 12,
    completedAt: null,
  },
];

const mockEmailCategories = [
  { name: "Newsletters", count: 234, type: "subscription" },
  { name: "Promotions", count: 567, type: "promotion" },
  { name: "Social Media", count: 123, type: "social" },
  { name: "Spam", count: 89, type: "spam" },
];

const mockScheduledCleanups = [
  {
    id: "1",
    name: "Weekly Newsletter Cleanup",
    frequency: "weekly",
    nextRun: "2024-01-22T09:00:00Z",
    isActive: true,
  },
  {
    id: "2",
    name: "Monthly Promotion Purge",
    frequency: "monthly",
    nextRun: "2024-02-01T12:00:00Z",
    isActive: true,
  },
];

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Email Cleanup Dashboard</h1>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Start New Cleanup
              </Button>
            </div>
            <div className="bg-blue-50 text-sm p-3 px-4 rounded-lg text-blue-700 flex gap-2 items-center border border-blue-200">
              <InfoIcon size="14" />
              <span>Connect your email account to start cleaning up your inbox</span>
            </div>
          </header>

          {/* Stats Overview */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Emails Cleaned</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,547</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unsubscribes</CardTitle>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">+8% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled Cleanups</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockScheduledCleanups.length}</div>
                <p className="text-xs text-muted-foreground">Active schedules</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Saved</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2 GB</div>
                <p className="text-xs text-muted-foreground">Inbox space freed</p>
              </CardContent>
            </Card>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Cleanup Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Recent Cleanup Jobs
                </CardTitle>
                <CardDescription>Your latest email cleanup activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCleanupJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{job.type}</h4>
                          <Badge variant={job.status === "completed" ? "default" : "secondary"}>
                            {job.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Processed: {job.emailsProcessed} | Deleted: {job.emailsDeleted} |
                          Unsubscribed: {job.emailsUnsubscribed}
                        </div>
                        {job.completedAt && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Completed: {new Date(job.completedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Email Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Email Categories
                </CardTitle>
                <CardDescription>Breakdown of your email types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockEmailCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            category.type === "subscription"
                              ? "bg-blue-500"
                              : category.type === "promotion"
                                ? "bg-green-500"
                                : category.type === "social"
                                  ? "bg-purple-500"
                                  : "bg-red-500"
                          }`}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <Badge variant="outline">{category.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scheduled Cleanups */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Scheduled Cleanups
                  </CardTitle>
                  <CardDescription>Automated cleanup schedules</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Schedules
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockScheduledCleanups.map((schedule) => (
                  <div key={schedule.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{schedule.name}</h4>
                      <Badge variant={schedule.isActive ? "default" : "secondary"}>
                        {schedule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Frequency: {schedule.frequency}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Next run: {new Date(schedule.nextRun).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Profile Section - Simplified */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="w-5 h-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <UserCircle size={48} className="text-primary" />
                <div>
                  <h3 className="font-semibold">{user.user_metadata?.full_name || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Member since {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </SubscriptionCheck>
  );
}
