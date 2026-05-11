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
        // 팝업 오버레이나 다이얼로그가 하나라도 떠 있는지 체크
        const hasPopup = !!document.querySelector('[role="dialog"]') || 
                         !!document.querySelector('.fixed') || 
                         !!document.querySelector('[data-state="open"]');

        if (hasPopup) {
          // 팝업이 있으면 히스토리 백으로 팝업만 닫기
          window.history.back();
        } else if (window.location.pathname === '/') {
          // 메인 화면이고 팝업 없으면 앱 종료
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
