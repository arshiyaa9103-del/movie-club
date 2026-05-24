import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { Film, Home, Activity, Users, PlusCircle, LogOut, Menu, UserPlus } from "lucide-react";
import { useState } from "react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isGuest = (user as any)?.isAnonymous === true;

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
            {user?.imageUrl && !isGuest ? (
              <img src={user.imageUrl} alt="Avatar" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{isGuest ? "Guest" : (user?.fullName || "User")}</span>
              <span className="text-xs text-muted-foreground truncate">
                {isGuest ? "Browsing as guest" : user?.primaryEmailAddress?.emailAddress}
              </span>
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
        {isGuest && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex items-center justify-between gap-4">
            <p className="text-sm text-foreground">
              <span className="font-medium">You're browsing as a guest.</span>{" "}
              <span className="text-muted-foreground">Create an account to save your watchlists and invite friends.</span>
            </p>
            <a
              href={`${basePath}/sign-up`}
              className="shrink-0 flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Account
            </a>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
