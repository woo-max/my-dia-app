import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const API_KEY = '6f477447436e696339366e59725966';
    const url = `https://swopenapi.seoul.go.kr/api/subway/${API_KEY}/json/realtimePosition/0/500/4호선`;

    const res = await fetch(url, {
      cache: 'no-store'
    });

    const data = await res.json();
    return NextResponse.json(data);

  } catch (e) {
    return NextResponse.json({
      error: true,
      realtimePositionList: []
    });
  }
}