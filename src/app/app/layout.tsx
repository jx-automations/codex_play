import { OutreachProvider } from "@/context/outreach-context";
import { NotificationPrompt } from "@/components/app/notification-prompt";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <OutreachProvider>
      {children}
      <NotificationPrompt />
    </OutreachProvider>
  );
}
