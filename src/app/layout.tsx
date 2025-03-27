import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ApolloWrapper } from "@/lib/apollo-provider";
import { Sidebar, SidebarProvider, SidebarToggle } from "@/components/ui/sidebar";

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
        <SidebarProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 transition-all duration-300">
              <SidebarToggle />
              <main className="p-4 md:p-6">
                <ApolloWrapper>{children}</ApolloWrapper>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
