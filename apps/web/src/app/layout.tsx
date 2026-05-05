import "./globals.css";
import { TokenRefreshPoller } from "@/components/TokenRefreshPoller";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Unified Calendar",
  description: "Unified multi-provider calendar",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TokenRefreshPoller />
        {children}
      </body>
    </html>
  );
}
