import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "DangasaAI — Next-Generation AI Education Platform",
  description: "AI-powered education platform with intelligent tutoring, anti-cheat exam tracking, smart auto-grading, and analytics dashboards for schools, colleges and universities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#020205] text-gray-100 selection:bg-purple-500/30 selection:text-purple-200 transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
