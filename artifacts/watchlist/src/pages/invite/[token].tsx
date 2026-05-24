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
      // If not logged in, redirect to sign up with the return URL
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/sign-up?redirect_url=${returnUrl}`;
      return;
    }

    acceptInvite.mutate(
      { token },
      {
        onSuccess: () => {
          toast({
            title: "Joined group",
            description: `You are now a member of ${invite?.groupName}`,
          });
          setLocation("/dashboard"); // ideally we'd go to the group, but we don't have groupId in the response easily without parsing
        },
        onError: () => {
          toast({
            title: "Error joining group",
            description: "The invite might be expired or invalid.",
            variant: "destructive"
          });
        }
      }
    );
  };

  if (isLoading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading invite...</div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-full mb-6">
          <Film className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Invalid Invite</h1>
        <p className="text-muted-foreground mb-8">This invite link is invalid or has expired.</p>
        <Link href="/" className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-xl text-center relative z-10">
        <div className="w-16 h-16 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">You've been invited!</h1>
        <p className="text-muted-foreground mb-8">
          Join <span className="font-semibold text-foreground">{invite.groupName}</span> on CineCircle.
        </p>

        {invite.description && (
          <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground mb-8 text-left border border-border/50">
            {invite.description}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
          <Users className="w-4 h-4" />
          {invite.memberCount} existing {invite.memberCount === 1 ? 'member' : 'members'}
        </div>

        <button
          onClick={handleAccept}
          disabled={acceptInvite.isPending}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          {user ? (
            acceptInvite.isPending ? "Joining..." : "Join Group"
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Sign in to join
            </>
          )}
        </button>

        {!user && (
          <p className="mt-4 text-xs text-muted-foreground">
            You'll need a CineCircle account to join. It's free!
          </p>
        )}
      </div>
    </div>
  );
}