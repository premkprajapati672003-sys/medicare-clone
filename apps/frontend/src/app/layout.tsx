import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClinAssist AI — Medical SaaS Platform",
  description: "Comprehensive healthcare scheduling, EHR, billing, and patient management.",
};

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
