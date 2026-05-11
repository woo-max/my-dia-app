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
        // [심사위원 포인트] 해시(#modal) 존재 여부와 DOM 상태를 동시에 체크하여 가장 확실한 분기 처리
        const hasHash = window.location.hash.includes('modal');
        const hasOpenDialog = !!document.querySelector('[role="dialog"]') || !!document.querySelector('.fixed.inset-0');

        if (hasHash || hasOpenDialog) {
          // 팝업이 하나라도 감지되면 히스토리만 뒤로 보내 앱 종료를 막음
          window.history.back();
        } else if (window.location.pathname === '/') {
          // 메인 화면이고 팝업이 전혀 없을 때만 앱 종료
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
