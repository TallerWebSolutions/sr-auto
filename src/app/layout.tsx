import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ApolloWrapper } from "@/lib/apollo-provider";
import { Sidebar, SidebarProvider, MainContent } from "@/components/ui/sidebar";

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
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className}>
        <ApolloWrapper>
          <SidebarProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <MainContent>
                {children}
              </MainContent>
            </div>
          </SidebarProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
