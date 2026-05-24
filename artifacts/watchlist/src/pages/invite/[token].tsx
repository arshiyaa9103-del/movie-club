import { useRoute, Link, useLocation } from "wouter";
import { useGetInvite, useAcceptInvite, getGetInviteQueryKey } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { Film, Users, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InvitePage() {
  const [, params] = useRoute("/invite/:token");
  const token = params?.token || "";
  const { user, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: invite, isLoading, error } = useGetInvite(token, { query: { enabled: !!token, queryKey: getGetInviteQueryKey(token) } });
  const acceptInvite = useAcceptInvite();

  const handleAccept = () => {
    if (!user) {
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/sign-up?redirect_url=${returnUrl}`;
      return;
    }
    acceptInvite.mutate(
      { token },
      {
        onSuccess: () => {
          toast({ title: "Joined group", description: `You are now a member of ${invite?.groupName}` });
          setLocation("/dashboard");
        },
        onError: () => {
          toast({ title: "Error joining group", description: "The invite might be expired or invalid.", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a1123" }}>
        <div className="animate-pulse text-[#8a8cac] text-sm">Loading invite...</div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden" style={{ background: "#0a1123" }}>
        <div className="fixed inset-0 pointer-events-none">
          <div style={{ position: "absolute", width: "60vw", height: "60vw", top: "-20vh", left: "-15vw", background: "radial-gradient(ellipse, rgba(131,135,195,0.08) 0%, transparent 65%)", borderRadius: "50%" }} />
        </div>
        <div className="relative z-10 glass-dense rounded-2xl p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(217,95,110,0.15)", border: "1px solid rgba(217,95,110,0.25)" }}>
            <Film className="w-8 h-8 text-[#d95f6e]" />
          </div>
          <h1 className="text-2xl font-bold text-[#e8eaf2] mb-2">Invalid Invite</h1>
          <p className="text-[#8a8cac] mb-8">This invite link is invalid or has expired.</p>
          <Link href="/" className="inline-flex items-center justify-center w-full py-3 rounded-xl font-semibold transition-all"
            style={{ background: "#8387c3", color: "#0a1123" }}>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "#0a1123" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div style={{ position: "absolute", width: "70vw", height: "70vw", top: "-25vh", left: "-20vw", background: "radial-gradient(ellipse, rgba(131,135,195,0.13) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", width: "55vw", height: "55vw", bottom: "-15vh", right: "-15vw", background: "radial-gradient(ellipse, rgba(58,62,108,0.4) 0%, transparent 65%)", borderRadius: "50%" }} />
      </div>

      <div className="glass-dense rounded-2xl p-8 max-w-md w-full text-center relative z-10">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(131,135,195,0.2)", border: "1px solid rgba(131,135,195,0.25)" }}>
          <Users className="w-8 h-8 text-[#8387c3]" />
        </div>

        <h1 className="text-2xl font-bold text-[#e8eaf2] mb-2">You've been invited!</h1>
        <p className="text-[#8a8cac] mb-8">
          Join <span className="font-semibold text-[#e8eaf2]">{invite.groupName}</span> on CineCircle.
        </p>

        {invite.description && (
          <div className="glass rounded-xl p-4 text-sm text-[#8a8cac] mb-6 text-left">
            {invite.description}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-[#8a8cac] mb-8">
          <Users className="w-4 h-4" />
          {invite.memberCount} existing {invite.memberCount === 1 ? 'member' : 'members'}
        </div>

        <button
          onClick={handleAccept}
          disabled={acceptInvite.isPending}
          className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{ background: "#8387c3", color: "#0a1123", boxShadow: "0 0 24px rgba(131,135,195,0.3)" }}
        >
          {user ? (
            acceptInvite.isPending ? "Joining..." : "Join Group"
          ) : (
            <><LogIn className="w-4 h-4" /> Sign in to join</>
          )}
        </button>

        {!user && (
          <p className="mt-4 text-xs text-[#8a8cac] opacity-70">
            You'll need a CineCircle account to join. It's free!
          </p>
        )}
      </div>
    </div>
  );
}
