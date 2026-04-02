import { NextResponse } from 'next/server';
import { loadArticles } from '@/lib/storage';
import { generateSlackDigestSummary, formatDigestSummaryForSlack, generateTextPreview } from '@/lib/slack/digest-generator';
import { postToSlack } from '@/lib/slack/bot';
import { ApiResponse, SlackDigestSummary } from '@/lib/types';

export async function GET() {
  try {
    const articles = await loadArticles();

    if (articles.length === 0) {
      return NextResponse.json({
        success: false,
        error: '記事がありません。先に情報を収集してください。',
      }, { status: 400 });
    }

    // まとめを生成
    const summary = generateSlackDigestSummary(articles);
    const textPreview = generateTextPreview(summary);
    const slackMessage = formatDigestSummaryForSlack(summary);

    const response: ApiResponse<{
      summary: SlackDigestSummary;
      textPreview: string;
      slackMessage: typeof slackMessage;
    }> = {
      success: true,
      data: {
        summary,
        textPreview,
        slackMessage,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('ダイジェスト生成エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'ダイジェストの生成に失敗しました',
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const articles = await loadArticles();

    if (articles.length === 0) {
      return NextResponse.json({
        success: false,
        error: '記事がありません。先に情報を収集してください。',
      }, { status: 400 });
    }

    // まとめを生成
    const summary = generateSlackDigestSummary(articles);
    const slackMessage = formatDigestSummaryForSlack(summary);

    // Slackに投稿
    const messageId = await postToSlack(slackMessage);

    return NextResponse.json({
      success: true,
      data: {
        messageId,
        summary,
      },
    });
  } catch (error) {
    console.error('Slack投稿エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'Slackへの投稿に失敗しました',
    }, { status: 500 });
  }
}
