import { AddProspectProvider } from "@/context/add-prospect-context";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { BottomNav } from "@/components/layout/BottomNav";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
import { AddProspectSheet } from "@/components/prospects/AddProspectSheet";
import { NotificationPrompt } from "@/components/app/notification-prompt";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <AddProspectProvider>
        <OfflineBanner />
        <BottomNav />
        {/* Content area: push right on desktop for sidebar, up on mobile for bottom nav */}
        <div className="min-h-screen pb-16 md:pb-0 md:pl-60">
          {children}
        </div>
        <FloatingActionButton />
        <AddProspectSheet />
        <NotificationPrompt />
      </AddProspectProvider>
    </AuthGuard>
  );
}
