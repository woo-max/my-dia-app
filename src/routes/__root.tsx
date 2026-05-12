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
      // 리스너 등록
      const backHandler = await CapApp.addListener('backButton', () => {
        // [필독] 팝업이 하나라도 열려있는지 확인하는 가장 확실한 방법
        const isModalOpen = !!document.querySelector('.fixed') || 
                            !!document.querySelector('[role="dialog"]') ||
                            window.location.hash.includes('modal');

        if (isModalOpen) {
          // 팝업이 있으면 뒤로가기 신호만 보내고 앱 종료는 막음
          window.history.back(); 
        } else if (window.location.pathname === '/' || window.location.pathname === '') {
          // 메인 화면이고 팝업이 없으면 앱 종료
          CapApp.exitApp();
        } else {
          // 그 외의 경우(다른 페이지) 일반 뒤로가기
          window.history.back();
        }
      });
      return backHandler;
    };

    const handlerPromise = setupBackButton();
    
    // 클린업: 중복 리스너 방지
    return () => {
      handlerPromise.then(h => h.remove());
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
