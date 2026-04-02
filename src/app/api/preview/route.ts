import { NextResponse } from 'next/server';
import { loadArticles } from '@/lib/storage';
import { generateWeeklyDigest } from '@/lib/ai/openai';
import { formatDigestForSlack, previewSlackMessage } from '@/lib/slack/bot';
import { ApiResponse } from '@/lib/types';

export async function GET() {
  try {
    const articles = await loadArticles();

    if (articles.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: '記事がありません。先に情報を収集してください。',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 週次ダイジェストを生成
    const digest = await generateWeeklyDigest(articles);

    // Slackメッセージフォーマットに変換
    const slackMessage = formatDigestForSlack(digest);

    // テキストプレビューを生成
    const textPreview = previewSlackMessage(slackMessage);

    const response: ApiResponse<{
      digest: typeof digest;
      slackMessage: typeof slackMessage;
      textPreview: string;
    }> = {
      success: true,
      data: {
        digest,
        slackMessage,
        textPreview,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('プレビュー生成エラー:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: 'プレビューの生成に失敗しました',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
