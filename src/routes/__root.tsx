import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useEffect(() => {
    // 안드로이드 물리 뒤로가기 버튼 감지
    const backHandler = CapApp.addListener('backButton', () => {
      // 1. 만약 열려있는 모달/팝업(Radix UI 등)이 있다면 
      // 브라우저의 기본 뒤로가기가 실행되며 팝업이 닫힙니다.
      // 2. 하지만 메인 화면에서 팝업이 없는 상태라면 앱을 종료합니다.
      if (window.location.pathname === '/') {
        CapApp.exitApp();
      } else {
        window.history.back();
      }
    });

    return () => {
      backHandler.remove();
    };
  }, []);

  return (
    <>
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </>
  );
}
