import { NextRequest, NextResponse } from 'next/server';
import { Article, CATEGORY_LABELS } from '@/lib/types';

interface SlackSummary {
  title: string;
  category: string;
  summary: string;
  keyPoints: string[];
  useCase: string;
  actionItem: string;
  url: string;
  slackText: string;
}

// ユースケースを生成
function generateUseCase(article: Article): string {
  const text = (article.title + ' ' + article.summary + ' ' + article.tips.join(' ')).toLowerCase();

  if (text.includes('ai') || text.includes('自動')) {
    return '会議後の議事録作成や要約作成を自動化したい時、手作業を減らして効率化したい時に活用できます。';
  }
  if (text.includes('セキュリティ') || text.includes('security') || text.includes('認証')) {
    return '外部との会議が多い方、機密情報を扱う会議がある方は、セキュリティ設定の見直しに活用できます。';
  }
  if (text.includes('slack') || text.includes('連携') || text.includes('integration')) {
    return 'SlackやTeamsなど他ツールと組み合わせて使っている方、ワークフローを効率化したい方に役立ちます。';
  }
  if (text.includes('録画') || text.includes('共有') || text.includes('recording')) {
    return '会議に参加できなかったメンバーへの共有、研修・オンボーディング用の動画作成に活用できます。';
  }
  if (text.includes('背景') || text.includes('background') || text.includes('アバター')) {
    return '在宅勤務で背景が気になる方、オンライン商談でプロフェッショナルな印象を与えたい方におすすめです。';
  }
  if (text.includes('チャット') || text.includes('chat') || text.includes('メッセージ')) {
    return '会議中のコミュニケーションを活性化したい時、質問やリアクションを促したい時に使えます。';
  }
  if (text.includes('会議') || text.includes('ミーティング') || text.includes('meeting')) {
    return '定例会議の効率化、1on1の質向上、チーム会議の生産性アップに活用できます。';
  }
  return '日常のオンライン会議をより効率的・快適にしたい全ての方に役立つ情報です。';
}

// アクションアイテムを生成
function generateActionItem(article: Article): string {
  const text = (article.title + ' ' + article.summary + ' ' + article.tips.join(' ')).toLowerCase();

  if (text.includes('設定') || text.includes('セキュリティ') || text.includes('security')) {
    return '次回の会議前に、自分のZoom設定を確認してみましょう。';
  }
  if (text.includes('ai') || text.includes('新機能') || text.includes('アップデート')) {
    return 'Zoomアプリを最新版にアップデートして、新機能を試してみましょう。';
  }
  if (text.includes('slack') || text.includes('連携')) {
    return 'Slack連携の設定を確認し、まだの方は設定してみましょう。';
  }
  if (text.includes('チーム') || text.includes('ルール') || text.includes('運用')) {
    return 'チーム内でこの情報を共有し、会議ルールの見直しを検討しましょう。';
  }
  if (article.tips.length > 0) {
    return `まずは「${article.tips[0]}」を今週の会議で試してみましょう。`;
  }
  return '元記事を読んで、自分のワークスタイルに合った活用方法を見つけましょう。';
}

// キーポイントを生成
function generateKeyPoints(article: Article): string[] {
  const points: string[] = [];

  // Tipsからキーポイントを抽出
  for (const tip of article.tips.slice(0, 3)) {
    points.push(tip);
  }

  // Tipsが少ない場合は要約から補完
  if (points.length < 2) {
    const summary = article.summary;
    if (summary.includes('。')) {
      const sentences = summary.split('。').filter(s => s.trim().length > 10);
      for (const sentence of sentences.slice(0, 3 - points.length)) {
        points.push(sentence.trim() + '。');
      }
    }
  }

  return points.slice(0, 3);
}

// Slack用テキストを生成
function generateSlackText(article: Article, summary: SlackSummary): string {
  const categoryLabel = CATEGORY_LABELS[article.category];

  let text = '';
  text += `${categoryLabel} *${summary.title}*\n\n`;
  text += `${summary.summary}\n\n`;
  text += `📌 *ポイント*\n`;
  for (const point of summary.keyPoints) {
    text += `• ${point}\n`;
  }
  text += `\n💼 *こんな時に使える*\n`;
  text += `${summary.useCase}\n\n`;
  text += `✅ *アクション*\n`;
  text += `${summary.actionItem}\n\n`;
  text += `🔗 ${summary.url}`;

  return text;
}

export async function POST(request: NextRequest) {
  try {
    const { article } = await request.json() as { article: Article };

    if (!article) {
      return NextResponse.json({
        success: false,
        error: '記事データがありません',
      }, { status: 400 });
    }

    const keyPoints = generateKeyPoints(article);
    const useCase = generateUseCase(article);
    const actionItem = generateActionItem(article);

    const summaryData: SlackSummary = {
      title: article.title,
      category: article.category,
      summary: article.summary,
      keyPoints,
      useCase,
      actionItem,
      url: article.originalUrl,
      slackText: '',
    };

    // Slack用テキストを生成
    summaryData.slackText = generateSlackText(article, summaryData);

    return NextResponse.json({
      success: true,
      data: summaryData,
    });
  } catch (error) {
    console.error('Slack要約生成エラー:', error);
    return NextResponse.json({
      success: false,
      error: '要約の生成に失敗しました',
    }, { status: 500 });
  }
}
