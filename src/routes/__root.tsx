import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { useEffect } from "react";
import { App as CapApp } from "@capacitor/app";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    const setupBackButton = async () => {
      const backHandler = await CapApp.addListener('backButton', () => {
        // 해시나 특정 팝업 클래스가 있으면 뒤로가기만 수행
        const hasPopup = window.location.hash.includes('modal') || 
                         !!document.querySelector('.fixed') || 
                         !!document.querySelector('[role="dialog"]');

        if (hasPopup) {
          window.history.back();
        } else if (window.location.pathname === '/') {
          CapApp.exitApp();
        } else {
          window.history.back();
        }
      });
      return backHandler;
    };
    const handlerPromise = setupBackButton();
    return () => { handlerPromise.then(h => h.remove()); };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
