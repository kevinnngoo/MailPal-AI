import { redirect } from "next/navigation";
import { checkUserSubscription } from "@/app/actions";
import { createClient } from "../../supabase/server";

interface SubscriptionCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireSubscription?: boolean;
}

export async function SubscriptionCheck({
  children,
  redirectTo = "/pricing",
  requireSubscription = false,
}: SubscriptionCheckProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Only check subscription if required (for premium features)
  if (requireSubscription) {
    const userId = user?.id;
    if (!userId) {
      redirect("/sign-in");
      return;
    }
    const isSubscribed = await checkUserSubscription(userId);
    if (!isSubscribed) {
      redirect(redirectTo);
    }
  }

  return <>{children}</>;
}
