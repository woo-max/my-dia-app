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
        // 팝업, 모달, 혹은 고정 레이어가 하나라도 있는지 정밀 체크
        const isPopupActive = !!document.querySelector('[role="dialog"]') || 
                             !!document.querySelector('.fixed.inset-0') ||
                             !!document.querySelector('[data-state="open"]');

        if (isPopupActive) {
          // 팝업이 감지되면 히스토리만 뒤로 보내 팝업만 닫음
          window.history.back();
        } else if (window.location.pathname === '/') {
          // 메인이고 팝업 없으면 앱 종료
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
