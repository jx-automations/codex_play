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
        <div className="min-h-screen pb-16 md:pb-0">
          {children}
        </div>
        <BottomNav />
        <FloatingActionButton />
        <AddProspectSheet />
        <NotificationPrompt />
      </AddProspectProvider>
    </AuthGuard>
  );
}
