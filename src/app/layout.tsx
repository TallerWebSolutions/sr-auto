import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ApolloWrapper } from "@/lib/apollo-provider";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GraphQL Data Viewer",
  description: "A Next.js application displaying GraphQL data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex gap-4">
            <Link href="/" className="hover:text-gray-300">
              Home
            </Link>
            <Link href="/demands" className="hover:text-gray-300">
              Demands
            </Link>
            <Link href="/lead-times" className="hover:text-gray-300">
              Lead Times
            </Link>
            <Link href="/hour-consumption" className="hover:text-gray-300">
              Consumo de Horas
            </Link>
          </div>
        </nav>
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
