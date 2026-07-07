import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NagrikTriage — Smart Bharat Civic Companion",
  description:
    "Turn messy, multilingual citizen frustration into structured, actionable government tickets using Gemini AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}