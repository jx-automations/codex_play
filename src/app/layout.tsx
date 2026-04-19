import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Work_Sans } from "next/font/google";

import { AuthProvider } from "@/context/auth-context";
import { PwaRegister } from "@/components/app/pwa-register";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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
  themeColor: "#6366F1",
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
    <html lang="en" className={`${spaceGrotesk.variable} ${workSans.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
