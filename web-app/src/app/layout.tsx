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

// API URL for preconnect - optimizes first API request by pre-establishing connection
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to API server - saves 100-300ms on first request in production */}
        <link rel="preconnect" href={API_URL} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={API_URL} />
      </head>
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
