import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardVoiceAgent } from "@/components/ai-voice/dashboard-voice-agent";
import type { ProfileWithBranch } from "@/lib/supabase/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile with branch info
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, branch:branches(*)")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const userProfile: ProfileWithBranch = {
    ...profile,
    branch: profile.branch || null,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar user={userProfile} />
      <main className="md:pl-64">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <DashboardVoiceAgent />
    </div>
  );
}
