import { NextResponse } from 'next/server';
import { manualCollect } from '@/lib/scheduler/cron';
import { ApiResponse, Article } from '@/lib/types';

export async function POST() {
  try {
    console.log('📡 手動収集開始...');

    const articles = await manualCollect({
      useMock: true, // デモ用にモックデータを使用
    });

    console.log(`✅ ${articles.length}件の記事を収集しました`);

    const response: ApiResponse<{ articles: Article[]; count: number }> = {
      success: true,
      data: {
        articles,
        count: articles.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('収集エラー:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '情報収集に失敗しました',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
