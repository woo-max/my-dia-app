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
        // [핵심] 현재 URL에 #이 붙어있거나 팝업이 하나라도 있으면 뒤로가기만 수행
        const hasModal = !!document.querySelector('[role="dialog"]') || 
                         !!document.querySelector('.fixed') || 
                         window.location.hash.includes('modal');

        if (hasModal) {
          window.history.back(); // 팝업만 닫기
        } else if (window.location.pathname === '/') {
          CapApp.exitApp(); // 메인에선 종료
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
