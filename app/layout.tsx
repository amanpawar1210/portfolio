import type { Metadata } from "next";
import "./globals.css";
import "./portfolio.css";
import "./theme.css";
import "./polish.css";

export const metadata: Metadata = {
  title: "Aman Pawar — Software Engineer",
  description: "Software Engineer building enterprise Angular, React and full-stack products.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
