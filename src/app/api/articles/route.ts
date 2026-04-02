import { NextResponse } from 'next/server';
import { loadArticles, getStats } from '@/lib/storage';
import { ApiResponse, Article } from '@/lib/types';

export async function GET() {
  try {
    const articles = await loadArticles();
    const stats = await getStats();

    const response: ApiResponse<{ articles: Article[]; stats: typeof stats }> = {
      success: true,
      data: {
        articles,
        stats,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('記事取得エラー:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: '記事の取得に失敗しました',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
