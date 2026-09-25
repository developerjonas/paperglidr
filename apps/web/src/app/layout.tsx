import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  // Relative canonical / Open Graph URLs on every page resolve against this.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Online courses from Nepali instructors`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: `${SITE_NAME} — Online courses from Nepali instructors`,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary" },
};

// One sans for body and headings (Tailwind: font-sans / font-display).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
