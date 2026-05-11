import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useEffect(() => {
    // 안드로이드 하드웨어 뒤로가기 버튼 감지
    const setupBackButton = async () => {
      const backHandler = await CapApp.addListener('backButton', () => {
        // 팝업(Dialog)이 열려있으면 브라우저 히스토리에 의해 팝업이 먼저 닫힙니다.
        // 만약 메인 화면(/)이고 더 이상 갈 곳이 없다면 앱을 종료합니다.
        if (window.location.pathname === '/') {
          CapApp.exitApp();
        } else {
          // 팝업이 열려있는 상태에서 뒤로가기를 누르면 팝업이 닫히도록 히스토리 백 실행
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
    <>
      <Outlet />
    </>
  );
}
