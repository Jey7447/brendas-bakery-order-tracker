import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brenda's Bakery",
  description: "Small-batch bakes for everyday celebrations."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
