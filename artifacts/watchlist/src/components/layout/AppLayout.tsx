import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { Film, Home, Activity, Users, PlusCircle, LogOut, Menu } from "lucide-react";
import { useState } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/activity", label: "Activity", icon: Activity },
    { href: "/groups/new", label: "New Group", icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Film className="w-5 h-5" />
          CineCircle
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? "flex" : "hidden"} 
        md:flex flex-col w-full md:w-64 border-r border-border bg-card p-4 md:min-h-screen
      `}>
        <Link href="/dashboard" className="hidden md:flex items-center gap-2 font-bold text-xl text-primary mb-8 px-2">
          <Film className="w-6 h-6" />
          CineCircle
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-4 border-t border-border flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            {user?.imageUrl && (
              <img src={user.imageUrl} alt="Avatar" className="w-8 h-8 rounded-full" />
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user?.fullName || "User"}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
          </div>
          <button 
            onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL })}
            className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors w-full rounded-md hover:bg-muted"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
