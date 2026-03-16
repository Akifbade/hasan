import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QGO Relocation - Professional Moving & Relocation Services",
  description: "Professional relocation and moving services. Get a free survey and quote for your move.",
  keywords: "relocation, moving, survey, shipping, container, UAE, Kuwait, Dubai",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
