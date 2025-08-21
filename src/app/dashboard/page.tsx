import DashboardNavbar from "@/components/dashboard-navbar";
import EmailCleanupWorkflow from "@/components/email-cleanup-workflow";
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
  Zap,
  Shield,
  Clock,
} from "lucide-react";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <SubscriptionCheck requireSubscription={false}>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Email Cleanup Dashboard</h1>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Connect Gmail
                </Button>
                <Button className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Start AI Cleanup
                </Button>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 text-sm p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <InfoIcon size="16" className="text-blue-600" />
                <span className="font-medium text-blue-900">Demo Mode Active</span>
              </div>
              <p className="text-blue-700">
                You're viewing sample data. Connect your Gmail account to start cleaning your real
                inbox with AI-powered categorization.
              </p>
            </div>
          </header>

          {/* Main Content Tabs */}
          <Tabs defaultValue="cleanup" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cleanup" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Cleanup
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cleanup" className="mt-6">
              <EmailCleanupWorkflow />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Analytics Overview</h2>
                  <Badge variant="outline">Last 30 days</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">24.5h</div>
                      <p className="text-xs text-muted-foreground">This month</p>
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
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Scheduled Cleanups</h2>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Schedules
                  </Button>
                </div>
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
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          <Settings className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Play className="w-3 h-3 mr-1" />
                          Run Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCircle className="w-5 h-5" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                      <UserCircle size={48} className="text-primary" />
                      <div>
                        <h3 className="font-semibold">{user.user_metadata?.full_name || "User"}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Member since {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Plan</span>
                        <Badge>Free Trial</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Emails Processed</span>
                        <span className="text-sm font-medium">47 / 50</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Trial Ends</span>
                        <span className="text-sm font-medium">Jan 29, 2024</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4">Upgrade to Pro</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Privacy & Security</CardTitle>
                    <CardDescription>Your data protection settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Content Storage</p>
                          <p className="text-sm text-muted-foreground">
                            We never store your email content
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Protected
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Data Encryption</p>
                          <p className="text-sm text-muted-foreground">
                            All data encrypted in transit and at rest
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Enabled
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">GDPR Compliant</p>
                          <p className="text-sm text-muted-foreground">
                            Full compliance with privacy regulations
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Compliant
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </SubscriptionCheck>
  );
}
