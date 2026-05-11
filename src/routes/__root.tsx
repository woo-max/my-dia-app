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
      // 안드로이드 뒤로가기 버튼 리스너
      const backHandler = await CapApp.addListener('backButton', () => {
        // [강력 체크] 화면에 팝업(모달, 다이얼로그)이 존재하는지 직접 확인
        const isPopupOpen = !!document.querySelector('[role="dialog"]') || !!document.querySelector('.fixed.inset-0');

        if (isPopupOpen) {
          // 팝업이 하나라도 있으면 웹 히스토리를 뒤로 돌려 팝업만 닫음
          window.history.back();
        } else if (window.location.pathname === '/') {
          // 메인이고 팝업 없으면 즉시 종료
          CapApp.exitApp();
        } else {
          window.history.back();
        }
      });
      return backHandler;
    };

    const handlerPromise = setupBackButton();
    return () => {
      handlerPromise.then(handler => handler.remove());
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
