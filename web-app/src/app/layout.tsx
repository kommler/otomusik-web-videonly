import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClientBodyWrapper } from "@/components/layout/ClientBodyWrapper";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OtoMusik - Video & Channel Management",
  description: "Modern web application for managing videos and channels with FastAPI backend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ClientBodyWrapper>
          {children}
        </ClientBodyWrapper>
      </body>
    </html>
  );
}
