import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Navigation from "@/components/navigation/Navigation";
import NavigationChrome from "@/components/navigation/NavigationChrome";
import ThemeInit from "./theme-init";
import RainbowScrollSync from "./rainbow-scroll-sync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DailyWrite - Track Your Writing Goals",
  description: "Keep track of your daily writing goals and progress",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <ThemeInit />
          <RainbowScrollSync />
          <NavigationChrome navigation={<Navigation />}>
            {children}
          </NavigationChrome>
        </SessionProvider>
      </body>
    </html>
  );
}
