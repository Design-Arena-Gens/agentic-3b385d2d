import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agentic AI Video Studio",
  description: "Multi-stage AI video creation agent UI"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-white">{children}</body>
    </html>
  );
}
