"use client";

import { createContext, useContext, useCallback } from "react";

// Analytics property types
type AnalyticsProperty = string | number | boolean | null | undefined;
type AnalyticsProperties = Record<string, AnalyticsProperty>;

interface AnalyticsContextType {
  track: (event: string, properties?: AnalyticsProperties) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const track = useCallback(async (event: string, properties: AnalyticsProperties = {}) => {
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event,
          properties: {
            ...properties,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            referrer: document.referrer,
          },
        }),
      });
    } catch (error) {
      console.error("Analytics tracking error:", error);
    }
  }, []);

  return <AnalyticsContext.Provider value={{ track }}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}

// Hook for tracking page views
export function usePageView() {
  const { track } = useAnalytics();

  return useCallback(
    (page: string) => {
      track("page_view", { page });
    },
    [track]
  );
}

// Hook for tracking user interactions
export function useTrackEvent() {
  const { track } = useAnalytics();

  return useCallback(
    (event: string, properties?: AnalyticsProperties) => {
      track(event, properties);
    },
    [track]
  );
}
