import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { App as CapApp } from "@capacitor/app"; // Capacitor 앱 제어 플러그인

// 404 페이지 로직 (원본 유지)
function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

// 에러 처리 로직 (원본 유지)
function ErrorComponent({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">화면을 불러올 수 없습니다</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6">
          <a href="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            다시 시도
          </a>
        </div>
      </div>
    </div>
  );
}

// 서버(SSR) 전용 기능들을 모두 제거한 앱용 루트 설정 (원본 유지)
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // --- [추가된 로직] 안드로이드 물리 뒤로가기 버튼 제어 ---
  useEffect(() => {
    const setupBackButton = async () => {
      const backHandler = await CapApp.addListener('backButton', () => {
        // 1. 화면에 떠 있는 팝업(모달, 다이얼로그)이 있는지 체크
        // 보통 shadcn/ui나 Radix UI는 [role="dialog"] 속성을 가집니다.
        const isPopupOpen = !!document.querySelector('[role="dialog"]');

        if (isPopupOpen) {
          // 팝업이 열려있으면 브라우저 히스토리 백을 실행 (팝업이 닫힙니다)
          window.history.back();
        } else if (window.location.pathname === '/') {
          // 메인 페이지이면서 팝업이 없으면 앱 종료
          CapApp.exitApp();
        } else {
          // 그 외의 페이지에서는 이전 페이지로 이동
          window.history.back();
        }
      });
      
      return backHandler;
    };

    const handlerPromise = setupBackButton();

    return () => {
      // 컴포넌트가 사라질 때 리스너 제거
      handlerPromise.then(handler => handler.remove());
    };
  }, []);
  // ---------------------------------------------------

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
