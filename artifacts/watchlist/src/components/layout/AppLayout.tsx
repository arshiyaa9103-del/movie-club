import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { Film, Home, Activity, PlusCircle, LogOut, Menu, X, UserPlus, Users } from "lucide-react";
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
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "#0a1123" }}>
      {/* Subtle fixed background gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div style={{
          position: "absolute", width: "60vw", height: "60vw",
          top: "-20vh", left: "-15vw",
          background: "radial-gradient(ellipse, rgba(131,135,195,0.10) 0%, transparent 65%)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", width: "50vw", height: "50vw",
          bottom: "-15vh", right: "-10vw",
          background: "radial-gradient(ellipse, rgba(58,62,108,0.35) 0%, transparent 65%)",
          borderRadius: "50%",
        }} />
      </div>

      {/* Mobile Header */}
      <header className="md:hidden relative z-20 flex items-center justify-between px-4 py-3 border-b border-[rgba(149,155,181,0.1)]"
        style={{ background: "rgba(35,40,80,0.55)", backdropFilter: "blur(20px)" }}>
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg" style={{ color: "#8387c3", fontFamily: "'Cinzel', serif" }}>
          <Film className="w-5 h-5" />
          CineCircle
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-[#959bb5] hover:text-[#e8eaf2] transition-colors">
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? "flex" : "hidden"}
        md:flex flex-col w-full md:w-60 border-r border-[rgba(149,155,181,0.1)]
        relative z-20 md:min-h-screen md:sticky md:top-0 md:h-screen
      `}
        style={{ background: "rgba(25,30,65,0.6)", backdropFilter: "blur(28px)" }}>

        <div className="hidden md:flex items-center gap-2.5 px-5 pt-6 pb-5 font-bold text-xl"
          style={{ color: "#8387c3", fontFamily: "'Cinzel', serif" }}>
          <Film className="w-5 h-5" />
          CineCircle
        </div>

        <nav className="flex-1 px-3 space-y-0.5 py-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "text-[#e8eaf2]"
                    : "text-[#8a8cac] hover:text-[#e8eaf2]"
                }`}
                style={isActive ? {
                  background: "rgba(131,135,195,0.18)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                  border: "1px solid rgba(131,135,195,0.2)",
                } : {}}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-[#8387c3]" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 space-y-3 border-t border-[rgba(149,155,181,0.1)] pt-4">
          <div className="flex items-center gap-3 px-2 py-1">
            {user?.imageUrl && !isGuest ? (
              <img src={user.imageUrl} alt="Avatar" className="w-8 h-8 rounded-full ring-1 ring-[rgba(131,135,195,0.3)]" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ background: "rgba(131,135,195,0.2)", color: "#8387c3" }}>
                {isGuest ? <Users className="w-4 h-4" /> : (user?.fullName?.charAt(0) || "?")}
              </div>
            )}
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="text-sm font-medium text-[#e8eaf2] truncate">{isGuest ? "Guest" : (user?.fullName || "User")}</span>
              <span className="text-xs text-[#8a8cac] truncate">
                {isGuest ? "Browsing as guest" : user?.primaryEmailAddress?.emailAddress}
              </span>
            </div>
          </div>

          {isGuest && (
            <a href={`${basePath}/sign-up`}
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: "rgba(131,135,195,0.18)", color: "#8387c3", border: "1px solid rgba(131,135,195,0.2)" }}>
              <UserPlus className="w-4 h-4" />
              Create Account
            </a>
          )}

          <button
            onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL })}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-[#8a8cac] hover:text-[#d95f6e] transition-colors hover:bg-[rgba(217,95,110,0.08)]"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {isGuest && (
          <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-[rgba(149,155,181,0.1)]"
            style={{ background: "rgba(131,135,195,0.1)", backdropFilter: "blur(12px)" }}>
            <p className="text-sm text-[#e8eaf2]">
              <span className="font-medium">You're browsing as a guest.</span>{" "}
              <span className="text-[#8a8cac]">Create an account to save your watchlists.</span>
            </p>
            <a href={`${basePath}/sign-up`}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: "#8387c3", color: "#0a1123" }}>
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
