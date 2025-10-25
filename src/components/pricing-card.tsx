"use client";

import { User } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";

interface PricingPlan {
  id: string;
  name: string;
  price?: number;
  amount: number;
  interval: string;
  description: string;
  features: string[];
  recommended?: boolean;
  popular?: boolean;
  priceId?: string;
}

export default function PricingCard({ item, user }: { item: PricingPlan; user: User | null }) {

  // Handle checkout process
  const handleCheckout = async (priceId: string) => {
    if (!user) {
      // Redirect to login if user is not authenticated
      window.location.href = "/sign-in?redirect=pricing";
      return;
    }

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert('Failed to start checkout process. Please try again.');
    }
  };

  // ...existing code...
  return (
    <Card
      className={`w-[350px] relative overflow-hidden ${item.popular ? "border-2 border-blue-500 shadow-xl scale-105" : "border border-gray-200"}`}
    >
      {item.popular && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-30" />
      )}
      <CardHeader className="relative">
        {item.popular && (
          <div className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-fit mb-4">
            Most Popular
          </div>
        )}
        <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
          {item.name}
        </CardTitle>
        <CardDescription className="flex items-baseline gap-2 mt-2">
          <span className="text-4xl font-bold text-gray-900">${item?.amount / 100}</span>
          <span className="text-gray-600">/{item?.interval}</span>
        </CardDescription>
        <div className="mt-2 text-xs text-gray-500 font-mono">Price ID: {item.id}</div>
      </CardHeader>
      <CardFooter className="relative flex flex-col gap-2">
        <Button
          onClick={async () => {
            await handleCheckout(item.id);
          }}
          className={`w-full py-6 text-lg font-medium`}
        >
          Get Started
        </Button>
        {process.env.NODE_ENV === "development" && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              console.log("Test checkout for:", item);
              await handleCheckout(item.id);
            }}
            className="w-full text-sm"
          >
            Test Checkout
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
