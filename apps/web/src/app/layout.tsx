import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TokenRefreshPoller } from "@/components/TokenRefreshPoller";

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
