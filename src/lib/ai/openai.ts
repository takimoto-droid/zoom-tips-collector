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

/**
 * 記事の要約とカテゴリ分類を行う
 */
export async function summarizeArticle(content: RawContent): Promise<ArticleSummary> {
  const client = getOpenAIClient();

  if (!client) {
    // APIキーがない場合はモック要約を返す
    return generateMockSummary(content);
  }

  try {
    const prompt = `
以下の記事を分析し、JSON形式で要約を生成してください。

【記事タイトル】
${content.title}

【記事内容】
${stripHtml(content.content).substring(0, 2000)}

【出力形式】
{
  "title": "日本語のわかりやすいタイトル（30文字以内）",
  "summary": "記事の要約（100-150文字程度）",
  "category": "以下から1つ選択: meeting, chat, security, integration, productivity, other",
  "tips": ["実践的なTips1", "実践的なTips2", "実践的なTips3"]
}

【カテゴリ説明】
- meeting: ミーティング機能に関する内容
- chat: チャット機能に関する内容
- security: セキュリティに関する内容
- integration: 外部サービス連携に関する内容
- productivity: 生産性向上に関する内容
- other: その他

JSONのみを出力してください。
`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'あなたはZoomの専門家です。記事を分析し、実践的なTipsを抽出して日本語で要約を生成します。必ず有効なJSONのみを出力してください。',
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

    // JSONをパース（```json ... ``` で囲まれている場合に対応）
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
 * モック要約を生成
 */
function generateMockSummary(content: RawContent): ArticleSummary {
  // カテゴリを推測
  const text = (content.title + ' ' + content.content).toLowerCase();
  let category: Category = 'other';

  if (text.includes('セキュリティ') || text.includes('security') || text.includes('パスワード')) {
    category = 'security';
  } else if (text.includes('チャット') || text.includes('chat') || text.includes('メッセージ')) {
    category = 'chat';
  } else if (text.includes('連携') || text.includes('integration') || text.includes('slack')) {
    category = 'integration';
  } else if (text.includes('生産性') || text.includes('productivity') || text.includes('効率')) {
    category = 'productivity';
  } else if (text.includes('ミーティング') || text.includes('meeting') || text.includes('会議')) {
    category = 'meeting';
  }

  // 簡易的な要約
  const plainText = stripHtml(content.content);
  const summary = plainText.substring(0, 150).replace(/\s+/g, ' ').trim() + '...';

  // Tipsを抽出（箇条書きっぽいものを探す）
  const tips: string[] = [];
  const lines = plainText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      (trimmed.startsWith('-') || trimmed.startsWith('・') || trimmed.startsWith('•')) &&
      trimmed.length > 5 &&
      trimmed.length < 100
    ) {
      tips.push(trimmed.replace(/^[-・•]\s*/, ''));
      if (tips.length >= 3) break;
    }
  }

  // Tipsが見つからない場合はデフォルト
  if (tips.length === 0) {
    tips.push('詳細は元の記事をご確認ください');
  }

  return {
    title: content.title.substring(0, 30),
    summary,
    category,
    tips,
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
      // API レート制限対策
      await new Promise((resolve) => setTimeout(resolve, 500));
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
  const client = getOpenAIClient();

  // 記事をカテゴリ別にグループ化
  const categoryGroups = articles.reduce(
    (acc, article) => {
      if (!acc[article.category]) {
        acc[article.category] = [];
      }
      acc[article.category].push(article);
      return acc;
    },
    {} as Record<Category, Article[]>
  );

  let highlights: string[] = [];

  if (client && articles.length > 0) {
    try {
      const articlesText = articles
        .map((a) => `- ${a.title}: ${a.summary}`)
        .join('\n');

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              '以下の記事一覧から、今週の重要なハイライトを3つ抽出してください。各ハイライトは1文で簡潔に。JSON配列形式で出力してください。',
          },
          {
            role: 'user',
            content: articlesText,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const responseText = response.choices[0]?.message?.content || '[]';
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      highlights = JSON.parse(jsonText);
    } catch (error) {
      console.error('ハイライト生成エラー:', error);
    }
  }

  // ハイライトがない場合はデフォルト生成
  if (highlights.length === 0) {
    highlights = articles.slice(0, 3).map((a) => a.title);
  }

  return {
    weekStart: formatDateJa(start),
    weekEnd: formatDateJa(end),
    articles,
    highlights,
    generatedAt: new Date().toISOString(),
  };
}
