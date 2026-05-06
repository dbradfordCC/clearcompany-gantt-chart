import type { Metadata } from "next";
import { Marcellus } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const marcellus = Marcellus({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-marcellus",
});

export const metadata: Metadata = {
  title: "ClearCo Implementation Timeline",
  description: "ClearCo implementation project timeline generator",
  icons: {
    icon: "/clearco-logomark.png",
    shortcut: "/clearco-logomark.png",
    apple: "/clearco-logomark.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${marcellus.variable} antialiased bg-[#FAF8F5]`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
