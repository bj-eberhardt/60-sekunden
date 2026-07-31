import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type AppRoute =
  '/' | '/new' | '/catalog' | `/catalog/${string}` | '/round' | '/task' | '/timer' | '/feedback';

type RouterContextValue = {
  route: AppRoute;
  navigate: (route: AppRoute) => void;
};

const routeSet = new Set<string>([
  '/',
  '/new',
  '/catalog',
  '/round',
  '/task',
  '/timer',
  '/feedback',
]);
const RouterContext = createContext<RouterContextValue | null>(null);

type RouterProviderProps = {
  children: ReactNode;
};

export function RouterProvider({ children }: RouterProviderProps) {
  const [route, setRoute] = useState<AppRoute>(() => normalizeRoute(window.location.pathname));

  useEffect(() => {
    function handlePopState() {
      setRoute(normalizeRoute(window.location.pathname));
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((nextRoute: AppRoute) => {
    if (nextRoute === normalizeRoute(window.location.pathname)) {
      return;
    }

    window.history.pushState(null, '', nextRoute);
    setRoute(nextRoute);
  }, []);

  const value = useMemo(() => ({ route, navigate }), [navigate, route]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const context = useContext(RouterContext);

  if (!context) {
    throw new Error('useRouter must be used inside RouterProvider.');
  }

  return context;
}

function normalizeRoute(pathname: string): AppRoute {
  if (routeSet.has(pathname) || pathname.startsWith('/catalog/')) {
    return pathname as AppRoute;
  }

  return '/';
}
