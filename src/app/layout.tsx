import type { Metadata, Viewport } from "next";

import { AuthProvider } from "@/context/auth-context";
import { PwaRegister } from "@/components/app/pwa-register";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "OutreachFlow",
    template: "%s | OutreachFlow",
  },
  description:
    "Log Instagram prospects in 30 seconds. Never miss a follow-up. Mobile-first chat tracker for solo operators.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OutreachFlow",
  },
};

export const viewport: Viewport = {
  themeColor: "#08111f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
