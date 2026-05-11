import { createRouter as createTanStackRouter, createHashHistory } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { QueryClient } from '@tanstack/react-query'

// 1. 프레임워크가 내부적으로 호출하는 함수 이름(getRouter)을 정확히 맞춰줍니다.
export function getRouter() {
  const queryClient = new QueryClient()

  return createTanStackRouter({
    routeTree,
    context: {
      queryClient,
    },
    // 안드로이드 앱의 로컬 경로 문제 방지를 위해 Hash History 사용
    history: createHashHistory(),
  })
}

// 2. 다른 곳에서 createRouter라는 이름으로 쓸 경우를 대비해 별칭으로도 내보냅니다.
export const createRouter = getRouter

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
