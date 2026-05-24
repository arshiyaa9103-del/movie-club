import { useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { useSignIn } from '@clerk/react/legacy';
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
    colorPrimary: "hsl(346.8 77.2% 49.8%)",
    colorForeground: "hsl(0 0% 98%)",
    colorMutedForeground: "hsl(240 5% 64.9%)",
    colorDanger: "hsl(0 62.8% 30.6%)",
    colorBackground: "hsl(240 10% 3.9%)",
    colorInput: "hsl(240 3.7% 15.9%)",
    colorInputForeground: "hsl(0 0% 98%)",
    colorNeutral: "hsl(240 3.7% 15.9%)",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-background rounded-2xl w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground",
    formFieldLabel: "text-foreground",
    footerActionLink: "text-primary",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    formFieldInput: "bg-input text-foreground border-neutral",
  },
};

function GuestLoginButton() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGuestLogin = async () => {
    if (!signIn || !setActive) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn.create({ strategy: "anonymous" as any });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || "Guest login unavailable. Please sign in.");
      setLoading(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleGuestLogin}
        disabled={loading}
        className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4 transition-colors disabled:opacity-50"
      >
        {loading ? "Signing in as guest..." : "Continue as Guest"}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
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
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="text-4xl">🎬</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-primary tracking-tight">CineCircle</h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-lg">Organize your viewing life with friends. The cozy film club for tracking what to watch next.</p>
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <a
              href={`${basePath}/sign-in`}
              className="w-full bg-primary text-primary-foreground px-8 py-3 rounded-md font-medium text-lg hover:opacity-90 transition-opacity text-center"
            >
              Sign In
            </a>
            <a
              href={`${basePath}/sign-up`}
              className="w-full bg-card border border-border text-foreground px-8 py-3 rounded-md font-medium text-lg hover:bg-muted transition-colors text-center"
            >
              Create Account
            </a>
            <div className="flex items-center gap-3 w-full my-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <GuestLoginButton />
          </div>
        </div>
      </Show>
    </>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
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