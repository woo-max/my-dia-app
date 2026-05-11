import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext } from "@tanstack/react-router";
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
        // [강력 체크] 팝업, 모달, 혹은 고정된 오버레이가 하나라도 있는지 확인
        const isPopupActive = !!document.querySelector('[role="dialog"]') || 
                             !!document.querySelector('.fixed.inset-0') ||
                             !!document.querySelector('[data-state="open"]');

        if (isPopupActive) {
          // 팝업이 있으면 팝업만 닫음
          window.history.back();
        } else if (window.location.pathname === '/') {
          // 메인이고 팝업 없으면 종료
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
