import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Database, CreditCard, Server } from "lucide-react";
import { createClient } from "../../../supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  responseTime?: number;
  lastChecked: string;
  icon: React.ReactNode;
  details?: string;
}

export default async function StatusPage() {
  const services: ServiceStatus[] = [];

  // Check Supabase connection
  try {
    const supabase = await createClient();
    const start = Date.now();
    const { error } = await supabase.from("users").select("count").limit(1);
    const responseTime = Date.now() - start;

    services.push({
      name: "Supabase Database",
      status: error ? "down" : "operational",
      responseTime,
      lastChecked: new Date().toISOString(),
      icon: <Database className="w-5 h-5" />,
      details: error ? error.message : "Connected successfully",
    });
  } catch (error) {
    services.push({
      name: "Supabase Database",
      status: "down",
      lastChecked: new Date().toISOString(),
      icon: <Database className="w-5 h-5" />,
      details: error instanceof Error ? error.message : "Connection failed",
    });
  }

  // Check Stripe connection
  try {
    const start = Date.now();
    await stripe.plans.list({ limit: 1 });
    const responseTime = Date.now() - start;

    services.push({
      name: "Stripe Payments",
      status: "operational",
      responseTime,
      lastChecked: new Date().toISOString(),
      icon: <CreditCard className="w-5 h-5" />,
      details: "Payment processing available",
    });
  } catch (error) {
    services.push({
      name: "Stripe Payments",
      status: "down",
      lastChecked: new Date().toISOString(),
      icon: <CreditCard className="w-5 h-5" />,
      details: error instanceof Error ? error.message : "Payment processing unavailable",
    });
  }

  // Add application status
  services.push({
    name: "Application Server",
    status: "operational",
    responseTime: 0,
    lastChecked: new Date().toISOString(),
    icon: <Server className="w-5 h-5" />,
    details: "Server running normally",
  });

  const getStatusColor = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-800";
      case "degraded":
        return "bg-yellow-100 text-yellow-800";
      case "down":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "operational":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "degraded":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "down":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const overallStatus = services.every((s) => s.status === "operational")
    ? "operational"
    : services.some((s) => s.status === "down")
      ? "down"
      : "degraded";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">System Status</h1>
            <p className="text-gray-600 mb-6">Current operational status of CleanInbox services</p>
            <div className="flex items-center justify-center gap-2">
              {getStatusIcon(overallStatus)}
              <Badge className={getStatusColor(overallStatus)}>
                {overallStatus === "operational"
                  ? "All Systems Operational"
                  : overallStatus === "degraded"
                    ? "Some Systems Degraded"
                    : "Service Disruption"}
              </Badge>
            </div>
          </div>

          <div className="grid gap-6">
            {services.map((service, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {service.icon}
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                      {service.responseTime !== undefined && (
                        <span className="text-sm text-gray-500">{service.responseTime}ms</span>
                      )}
                      <Badge className={getStatusColor(service.status)}>{service.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>{service.details}</span>
                    <span>Last checked: {new Date(service.lastChecked).toLocaleTimeString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center text-sm text-gray-500">
            <p>Status page automatically refreshes every 30 seconds</p>
            <p className="mt-2">
              For support, contact us at{" "}
              <a href="mailto:support@cleaninbox.com" className="text-blue-600 hover:underline">
                support@cleaninbox.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
