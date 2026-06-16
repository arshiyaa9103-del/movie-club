import { useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useSignUp } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import NewGroup from "@/pages/groups/new";
import GroupPage from "@/pages/groups/[groupId]";
import MovieDetailPage from "@/pages/groups/[groupId]/movie/[entryId]";
import InvitePage from "@/pages/invite/[token]";
import ActivityPage from "@/pages/activity";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
  },
  variables: {
    colorPrimary: "#8387c3",
    colorForeground: "#e8eaf2",
    colorMutedForeground: "#959bb5",
    colorDanger: "#d95f6e",
    colorBackground: "#0d1530",
    colorInput: "rgba(10, 17, 35, 0.6)",
    colorInputForeground: "#e8eaf2",
    colorNeutral: "#3a3e6c",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "rounded-2xl w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#e8eaf2]",
    headerSubtitle: "text-[#959bb5]",
    socialButtonsBlockButtonText: "text-[#e8eaf2]",
    formFieldLabel: "text-[#e8eaf2]",
    footerActionLink: "text-[#8387c3]",
    footerActionText: "text-[#959bb5]",
    dividerText: "text-[#8a8cac]",
    formFieldInput: "bg-[rgba(10,17,35,0.55)] border-[rgba(149,155,181,0.2)] text-[#e8eaf2]",
  },
};

function LiquidBackground() {
  return (
    <div className="liquid-bg" aria-hidden="true">
      <div className="liquid-orb-mid" />
    </div>
  );
}

function GuestLoginButton() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGuestLogin = async () => {
    if (!signUp || !setActive) return;
    setLoading(true);
    setError("");
    try {
      const guestId = Math.random().toString(36).slice(2, 10);
      const emailAddress = `guest_${guestId}@cinecircle.guest`;
      const password = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + "Aa1!";

      let result = await signUp.create({ emailAddress, password });

      if (result.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        result = await signUp.attemptEmailAddressVerification({ code: "424242" });
      }

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else {
        throw new Error("Could not complete guest sign-in.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || "Guest login unavailable.";
      setError(msg);
      setLoading(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleGuestLogin}
        disabled={loading}
        className="text-[#8a8cac] hover:text-[#e8eaf2] text-sm underline underline-offset-4 transition-colors disabled:opacity-50"
      >
        {loading ? "Creating guest session..." : "Continue as Guest"}
      </button>
      {error && <p className="text-xs text-[#d95f6e] max-w-[260px] text-center">{error}</p>}
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
          <LiquidBackground />

          <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
            <div className="mb-6 flex items-center justify-center">
              <img src={`${basePath}/logo.png`} alt="CineCircle Logo" className="w-24 h-24 object-contain drop-shadow-lg" />
            </div>

            <h1
              className="text-6xl font-bold mb-3 tracking-wide"
              style={{ fontFamily: "'Cinzel', serif", color: "#8387c3", textShadow: "0 0 40px rgba(131,135,195,0.4)" }}
            >
              CineCircle
            </h1>
            <p className="text-[#8a8cac] text-lg mb-10 leading-relaxed">
              Your cozy film club.<br />Track, discover, and share movies with friends.
            </p>

            <div className="glass-dense rounded-2xl p-6 w-full space-y-3">
              <a
                href={`${basePath}/sign-in`}
                className="w-full flex items-center justify-center bg-[#8387c3] text-[#0a1123] px-6 py-3 rounded-xl font-semibold text-base hover:bg-[#959bb5] transition-colors glow-primary"
              >
                Sign In
              </a>
              <a
                href={`${basePath}/sign-up`}
                className="w-full flex items-center justify-center glass glass-hover text-[#e8eaf2] px-6 py-3 rounded-xl font-medium text-base"
              >
                Create Account
              </a>
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-[rgba(149,155,181,0.15)]" />
                <span className="text-xs text-[#8a8cac]">or</span>
                <div className="flex-1 h-px bg-[rgba(149,155,181,0.15)]" />
              </div>
              <GuestLoginButton />
            </div>

            <p className="mt-6 text-xs text-[#8a8cac] opacity-60">
              No credit card required. Free forever.
            </p>
          </div>
        </div>
      </Show>
    </>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 relative overflow-hidden">
      <LiquidBackground />
      <div className="relative z-10 glass-dense rounded-2xl overflow-hidden">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} appearance={clerkAppearance} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 relative overflow-hidden">
      <LiquidBackground />
      <div className="relative z-10 glass-dense rounded-2xl overflow-hidden">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} appearance={clerkAppearance} />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ProtectedRoute({ component: Component, ...rest }: any) {
  return (
    <Route {...rest}>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </Route>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey || ""}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/invite/:token" component={InvitePage} />

            <ProtectedRoute path="/dashboard" component={Dashboard} />
            <ProtectedRoute path="/groups/new" component={NewGroup} />
            <ProtectedRoute path="/groups/:groupId" component={GroupPage} />
            <ProtectedRoute path="/groups/:groupId/movie/:entryId" component={MovieDetailPage} />
            <ProtectedRoute path="/activity" component={ActivityPage} />

            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
      <Toaster />
    </WouterRouter>
  );
}

export default App;
