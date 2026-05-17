import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AppShell } from "@/components/AppShell";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
          Off the syllabus
        </div>
        <h1 className="mt-2 text-7xl font-semibold tracking-tight text-gradient-cyan">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">That route isn't part of your prep plan.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
        >
          Back to Mission Control
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center glass-panel rounded-2xl p-8">
        <h1 className="text-xl font-semibold tracking-tight">Something interrupted your flow</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Retry
          </button>
          <a href="/" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2">
            Mission Control
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "JEE OS — Elite Operating System for AIR < 100" },
      {
        name: "description",
        content:
          "An elite command center for IIT-JEE preparation: deep work, error intelligence, spaced revision, mock analytics and an AI mentor.",
      },
      { property: "og:title", content: "JEE OS — Elite Operating System for AIR < 100" },
      { name: "twitter:title", content: "JEE OS — Elite Operating System for AIR < 100" },
      { name: "description", content: "Apex Rank OS is an AI-powered platform for IIT-JEE aspirants to maximize rank potential." },
      { property: "og:description", content: "Apex Rank OS is an AI-powered platform for IIT-JEE aspirants to maximize rank potential." },
      { name: "twitter:description", content: "Apex Rank OS is an AI-powered platform for IIT-JEE aspirants to maximize rank potential." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7441f734-d472-4494-908d-15162ed40979/id-preview-24f8eb2d--869c800b-5e8c-4b29-9a15-56d086ed0183.lovable.app-1779009614660.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7441f734-d472-4494-908d-15162ed40979/id-preview-24f8eb2d--869c800b-5e8c-4b29-9a15-56d086ed0183.lovable.app-1779009614660.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  if (pathname === "/auth") return <>{children}</>;
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!user) {
    if (typeof window !== "undefined") window.location.replace("/auth");
    return null;
  }
  return <AppShell>{children}</AppShell>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Gate>
          <Outlet />
        </Gate>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
