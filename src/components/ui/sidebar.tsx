"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  LayoutDashboardIcon,
  UsersIcon,
  ClockIcon,
  BarChart3Icon,
  ListTodoIcon,
  FileTextIcon,
  FolderIcon,
  ListOrderedIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MenuIcon,
} from "lucide-react";
import { Button } from "./button";

type SidebarContextType = {
  collapsed: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextType | undefined>(
  undefined
);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);

  const toggleSidebar = React.useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function SidebarToggle() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleSidebar}
      className="h-8 w-8 fixed top-4 right-4 md:hidden"
    >
      <MenuIcon className="h-4 w-4" />
    </Button>
  );
}

export function Sidebar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const pathname = usePathname();
  const { collapsed, toggleSidebar } = useSidebar();

  const navItems = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/demands", label: "Demands", icon: ListTodoIcon },
    { href: "/board", label: "Board", icon: LayoutDashboardIcon },
    { href: "/team-board", label: "Team Board", icon: UsersIcon },
    { href: "/lead-times", label: "Lead Times", icon: ClockIcon },
    {
      href: "/hour-consumption",
      label: "Consumo de Horas",
      icon: BarChart3Icon,
    },
    { href: "/escopo", label: "Escopo", icon: FileTextIcon },
    { href: "/status-report", label: "Status Report", icon: FileTextIcon },
    {
      href: "/portfolio-units",
      label: "Unidades de Portfolio",
      icon: FolderIcon,
    },
    { href: "/priorizacao", label: "Priorização", icon: ListOrderedIcon },
  ];

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-gray-800 text-white transition-all duration-300 fixed left-0 top-0",
        collapsed ? "-translate-x-full md:translate-x-0 md:w-16" : "w-64",
        "z-30",
        className
      )}
      {...props}
    >
      <div className="p-4 flex justify-between items-center">
        {!collapsed && <h1 className="text-xl font-bold">Menu</h1>}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-700 transition-colors",
                    pathname === item.href && "bg-gray-700 font-medium"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        "flex-1 transition-all duration-300",
        collapsed ? "md:pl-16" : "md:pl-64"
      )}
    >
      <SidebarToggle />
      <main className="p-4 md:p-6 w-full">{children}</main>
    </div>
  );
}
