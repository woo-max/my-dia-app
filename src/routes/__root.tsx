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
        // [중요] 팝업 레이어가 하나라도 존재하면 뒤로가기만 수행
        const isPopupOpen = !!document.querySelector('.fixed') || 
                            !!document.querySelector('[role="dialog"]') ||
                            window.location.hash.includes('modal');

        if (isPopupOpen) {
          window.history.back(); // 팝업 닫기 시그널
        } else if (window.location.pathname === '/' || window.location.pathname === '') {
          CapApp.exitApp(); // 메인에선 앱 종료
        } else {
          window.history.back(); // 일반 페이지 뒤로가기
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
