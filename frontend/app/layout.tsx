import type { Metadata } from "next";
import { TrainerResultSpriteSync } from "@/components/TrainerResultSpriteSync";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokemon 6",
  description: "Build a six Pokemon team and test it against the MVP scoring challenge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TrainerResultSpriteSync />
        {children}
      </body>
    </html>
  );
}
