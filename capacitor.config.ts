import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hyunwook.shift',
  appName: '다이아리',
  webDir: 'dist',

  plugins: {
    SplashScreen: {
      launchShowDuration: 0,    // 🚀 0초로 설정 (아이콘 안 보여줌)
      launchAutoHide: true,     // 즉시 자동 숨김
      backgroundColor: "#111111", // 빈 화면이 보일 때 앱 배경색과 맞춤 (이질감 감소)
    },
  },
};

export default config;