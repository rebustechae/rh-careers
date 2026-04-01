import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rebus Holdings Careers",
  description: "Explore career opportunities at Rebus Holdings. Join our team across engineering, technology, projects management, and safety roles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      >
        {children}
      </body>
    </html>
  );
}
