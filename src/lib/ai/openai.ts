import OpenAI from 'openai';
import { RawContent, Article, ArticleSummary, Category, WeeklyDigest } from '../types';
import { generateId, stripHtml, getWeekRange, formatDateJa } from '../utils';

// OpenAI クライアントの初期化
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY が設定されていません');
    return null;
  }
  return new OpenAI({ apiKey });
}

// 英語記事の日本語タイトル・要約マッピング
const articleTranslations: Record<string, { title: string; summary: string; tips: string[] }> = {
  'zoom introduces an ai-powered': {
    title: 'Zoom、AI搭載オフィススイートを発表',
    summary: 'ZoomがAI搭載のオフィススイートを発表。ミーティング用のAIアバター機能も近日公開予定。リアルタイムのディープフェイク検出技術も導入される。',
    tips: ['AI機能で会議の生産性を向上', 'AIアバターで会議参加の負担軽減', 'ディープフェイク検出でセキュリティ強化'],
  },
  'zoom brings its ai assistant': {
    title: 'Zoom AIアシスタント、無料ユーザーにも提供開始',
    summary: 'ZoomがAIアシスタント機能をWeb版で提供開始。無料ユーザーも限定的に利用可能に。会議の要約やアクションアイテムの抽出が可能。',
    tips: ['無料プランでもAI機能を試せる', 'Web版でAIアシスタントを活用', '会議要約機能で議事録作成を効率化'],
  },
  'zoom ceo eric yuan says ai will': {
    title: 'Zoom CEO「AIで週3〜4日勤務が実現する」',
    summary: 'Zoom CEOのエリック・ユアン氏が、数年後にはAIの進化により週3〜4日勤務が実現するとの見解を示した。',
    tips: ['AIによる業務効率化を推進', '将来の働き方の変化に備える', 'AI活用で生産性を高める'],
  },
  'zoom launches a cross-application ai notetaker': {
    title: 'Zoom、アプリ横断AI議事録機能をリリース',
    summary: 'Zoomがアプリ横断型のAI議事録機能とAIアバター機能をリリース。ミーティングと生産性プラットフォームの最新アップデート。',
    tips: ['AI議事録で会議内容を自動記録', 'AIアバターでビデオ会議に参加', '複数アプリ間でシームレスに連携'],
  },
  'after klarna': {
    title: 'Zoom CEOもAIアバターで決算発表',
    summary: 'KlarnaのCEOに続き、Zoom CEOも決算発表でAIアバターを使用。AIアバターによるビデオコミュニケーションの活用が広がる。',
    tips: ['AIアバターの活用事例として参考に', 'オンライン会議の新しい形を検討', 'AI技術の進化に注目'],
  },
};

/**
 * 記事タイトルから翻訳データを検索
 */
function findTranslation(title: string): { title: string; summary: string; tips: string[] } | null {
  const lowerTitle = title.toLowerCase();
  for (const [key, value] of Object.entries(articleTranslations)) {
    if (lowerTitle.includes(key)) {
      return value;
    }
  }
  return null;
}

/**
 * 記事の要約とカテゴリ分類を行う
 */
export async function summarizeArticle(content: RawContent): Promise<ArticleSummary> {
  const client = getOpenAIClient();

  if (!client) {
    return generateMockSummary(content);
  }

  try {
    const prompt = `
以下の記事を分析し、JSON形式で日本語の要約を生成してください。
英語の記事の場合は必ず日本語に翻訳してください。

【記事タイトル】
${content.title}

【記事内容】
${stripHtml(content.content).substring(0, 2000)}

【出力形式】
{
  "title": "日本語のわかりやすいタイトル（30文字以内）",
  "summary": "記事の要約（日本語で100-150文字程度）",
  "category": "以下から1つ選択: meeting, chat, security, integration, productivity, other",
  "tips": ["実践的なTips1（日本語）", "実践的なTips2（日本語）", "実践的なTips3（日本語）"]
}

JSONのみを出力してください。
`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたはZoomの専門家です。記事を分析し、必ず日本語で要約を生成します。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = response.choices[0]?.message?.content || '';
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const summary: ArticleSummary = JSON.parse(jsonText);
    return summary;
  } catch (error) {
    console.error('OpenAI API エラー:', error);
    return generateMockSummary(content);
  }
}

/**
 * モック要約を生成（日本語翻訳付き）
 */
function generateMockSummary(content: RawContent): ArticleSummary {
  const text = (content.title + ' ' + content.content).toLowerCase();
  let category: Category = 'other';

  // カテゴリを推測
  if (text.includes('security') || text.includes('セキュリティ') || text.includes('encryption')) {
    category = 'security';
  } else if (text.includes('chat') || text.includes('チャット') || text.includes('message')) {
    category = 'chat';
  } else if (text.includes('integration') || text.includes('連携') || text.includes('slack') || text.includes('workflow')) {
    category = 'integration';
  } else if (text.includes('productivity') || text.includes('生産性') || text.includes('ai')) {
    category = 'productivity';
  } else if (text.includes('meeting') || text.includes('ミーティング') || text.includes('会議') || text.includes('call')) {
    category = 'meeting';
  }

  // 翻訳データを検索
  const translation = findTranslation(content.title);

  if (translation) {
    return {
      title: translation.title,
      summary: translation.summary,
      category,
      tips: translation.tips,
    };
  }

  // 日本語記事の場合はそのまま処理
  const isJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(content.title);

  let title = content.title;
  if (title.length > 30) {
    title = title.substring(0, 28) + '...';
  }

  let summary = stripHtml(content.content).substring(0, 150).replace(/\s+/g, ' ').trim();
  if (!summary.endsWith('。') && !summary.endsWith('...')) {
    summary += '...';
  }

  // Tipsを生成
  const tips: string[] = [];
  if (text.includes('ai')) tips.push('AI機能を活用して業務効率化');
  if (text.includes('meeting') || text.includes('call')) tips.push('ミーティングの生産性を向上');
  if (text.includes('avatar')) tips.push('AIアバターで会議参加の負担軽減');
  if (text.includes('security')) tips.push('セキュリティ設定を確認・強化');
  if (text.includes('slack')) tips.push('Slack連携で効率化');

  if (tips.length === 0) {
    tips.push('詳細は元の記事をご確認ください');
  }

  return {
    title,
    summary,
    category,
    tips: tips.slice(0, 3),
  };
}

/**
 * RawContentをArticleに変換
 */
export async function processContent(content: RawContent): Promise<Article> {
  const summary = await summarizeArticle(content);

  return {
    id: generateId('article'),
    title: summary.title,
    summary: summary.summary,
    category: summary.category,
    tips: summary.tips,
    originalUrl: content.url,
    source: content.source,
    publishedAt: content.publishedAt.toISOString(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * 複数のRawContentを処理
 */
export async function processMultipleContents(contents: RawContent[]): Promise<Article[]> {
  const articles: Article[] = [];

  for (const content of contents) {
    try {
      const article = await processContent(content);
      articles.push(article);
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`記事処理エラー (${content.title}):`, error);
    }
  }

  return articles;
}

/**
 * 週次ダイジェストを生成
 */
export async function generateWeeklyDigest(articles: Article[]): Promise<WeeklyDigest> {
  const { start, end } = getWeekRange();

  const highlights = articles.slice(0, 3).map((a) => a.title);

  return {
    weekStart: formatDateJa(start),
    weekEnd: formatDateJa(end),
    articles,
    highlights,
    generatedAt: new Date().toISOString(),
  };
}
