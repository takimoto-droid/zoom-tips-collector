import OpenAI from 'openai';
import { RawContent, Article, ArticleSummary, Category, Priority, ArticleType, WeeklyDigest } from '../types';
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
const articleTranslations: Record<string, { title: string; summary: string; tips: string[]; priority: Priority; articleType: ArticleType }> = {
  'zoom introduces an ai-powered': {
    title: 'Zoom、AI搭載オフィススイートを発表',
    summary: 'ZoomがAI搭載のオフィススイートを発表。ミーティング用のAIアバター機能も近日公開予定。リアルタイムのディープフェイク検出技術も導入される。',
    tips: ['管理ポータル > AI Companion > 「会議要約」をONで自動議事録生成', '設定 > ビデオ > AIアバターを有効化でカメラOFF時も表情付きで参加', 'セキュリティ > ディープフェイク検出をONで不正参加を防止'],
    priority: 'high',
    articleType: 'new_feature',
  },
  'zoom brings its ai assistant': {
    title: 'Zoom AIアシスタント、無料ユーザーにも提供開始',
    summary: 'ZoomがAIアシスタント機能をWeb版で提供開始。無料ユーザーも限定的に利用可能に。会議の要約やアクションアイテムの抽出が可能。',
    tips: ['無料プランでもzoom.usのWeb版からAIアシスタントを試せる', '会議中にAI Companionパネルを開くとリアルタイム要約が表示される', '会議終了後、メール通知の要約リンクからアクションアイテムを確認'],
    priority: 'high',
    articleType: 'hack',
  },
  'zoom ceo eric yuan says ai will': {
    title: 'Zoom CEO「AIで週3〜4日勤務が実現する」',
    summary: 'Zoom CEOのエリック・ユアン氏が、数年後にはAIの進化により週3〜4日勤務が実現するとの見解を示した。',
    tips: ['AI Companionの会議要約機能で議事録作成時間を削減', '定型会議はAI要約+録画で非同期化を検討', 'Zoom Docs連携でAI要約から直接ドキュメント生成'],
    priority: 'medium',
    articleType: 'news',
  },
  'zoom launches a cross-application ai notetaker': {
    title: 'Zoom、アプリ横断AI議事録機能をリリース',
    summary: 'Zoomがアプリ横断型のAI議事録機能とAIアバター機能をリリース。Teams/Google MeetにもZoom AI議事録ボットを参加させられる。',
    tips: ['設定 > AI Companion > 「外部ミーティング対応」をONでTeams会議にもAI議事録を適用', 'AIアバター > カスタムアバターを作成すれば自分そっくりのアバターで参加可能', 'AI議事録はZoom Docsに自動保存され、後からキーワード検索できる'],
    priority: 'high',
    articleType: 'new_feature',
  },
  'after klarna': {
    title: 'Zoom CEOもAIアバターで決算発表',
    summary: 'KlarnaのCEOに続き、Zoom CEOも決算発表でAIアバターを使用。AIアバターによるビデオコミュニケーションの活用が広がる。',
    tips: ['Zoom Clips > AIアバターで動画メッセージを作成すれば録画不要', '定例報告をAIアバター動画に置き換えて会議時間を削減', 'AIアバターは26言語対応。海外拠点への案内動画にも活用可能'],
    priority: 'medium',
    articleType: 'ai',
  },
};

/**
 * 記事タイトルから翻訳データを検索
 */
function findTranslation(title: string): { title: string; summary: string; tips: string[]; priority: Priority; articleType: ArticleType } | null {
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

【記事タイプの優先順位（上から優先）】
1. hack（★★★最優先）: 実践テクニック、設定方法、効率化手法、「こうすればできる」系
2. new_feature（★★）: 新機能の紹介で「何ができるか」が具体的にわかる記事
3. ai（★★）: AI Companion、AI要約などAI活用の具体的な方法
4. news（★）: 業界動向、パートナー情報

【除外すべき記事の特徴】（該当する場合はpriority=lowにする）
- 「○○社が導入」のような活用事例・導入事例
- エラー対処、障害対応などのトラブルシューティング
- 抽象的で「AIがすごい」だけの記事（具体的な操作手順がない）
- Zoom以外の製品が主役の記事

【出力形式】
{
  "title": "日本語のわかりやすいタイトル（30文字以内）",
  "summary": "「何が具体的にできるか」を明記した要約（日本語100-150文字）",
  "category": "以下から1つ選択: meeting, phone, chat, security, integration, productivity, other",
  "tips": [
    "今日から試せる具体的なTips1（設定手順や操作方法を含む）",
    "今日から試せる具体的なTips2",
    "今日から試せる具体的なTips3"
  ],
  "priority": "high または medium（lowは保存しない）",
  "articleType": "hack, new_feature, ai, news のいずれか"
}

【Tipsの書き方ルール】
- 「○○を活用」のような曖昧な表現は禁止
- 「設定 > ○○ > △△をONにすると□□ができる」のように具体的に書く
- 読んだ人が「やってみたい！」「そんなことできるんだ！」と思える内容にする

JSONのみを出力してください。
`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたはZoomの専門家でIS部門の管理者です。記事を分析し、読者が「やってみたい！」「そんなことできるんだ！」と思える実践的なTipsを抽出します。必ず日本語で出力してください。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 600,
    });

    const responseText = response.choices[0]?.message?.content || '';
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonText);
    const summary: ArticleSummary = {
      title: parsed.title,
      summary: parsed.summary,
      category: parsed.category || 'other',
      tips: parsed.tips || [],
      priority: parsed.priority || 'medium',
      articleType: parsed.articleType || 'news',
    };
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
  if (text.includes('phone') || text.includes('電話') || text.includes('pbx') || text.includes('通話') || text.includes('内線') || text.includes('外線') || text.includes('ボイスメール') || text.includes('voicemail') || text.includes('ivr') || text.includes('ソフトフォン')) {
    category = 'phone';
  } else if (text.includes('security') || text.includes('セキュリティ') || text.includes('encryption')) {
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
      priority: translation.priority,
      articleType: translation.articleType,
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

  // Tipsを生成（具体的なアクションを含める）
  const tips: string[] = [];
  if (text.includes('ai') && text.includes('companion')) tips.push('設定 > AI Companion でAI要約機能をONにすると会議後に自動で議事録が生成される');
  else if (text.includes('ai')) tips.push('Zoom管理ポータル > AI機能タブから利用可能な機能を確認してみよう');
  if (text.includes('meeting') || text.includes('call')) tips.push('ミーティング設定 > 自動録画をONにすれば録画忘れがなくなる');
  if (text.includes('avatar')) tips.push('AIアバターを使えばカメラOFFでも表情豊かに会議参加できる');
  if (text.includes('security')) tips.push('セキュリティ > 待機室を有効にし、パスコード必須にする');
  if (text.includes('slack')) tips.push('Slack連携を設定すれば/zoomコマンドでワンクリック会議開始');
  if (text.includes('phone') || text.includes('電話')) tips.push('Zoom Phone設定 > コールキューで着信を複数人に分散できる');
  if (text.includes('background') || text.includes('背景')) tips.push('設定 > 背景とエフェクト > 会社ロゴ入り背景をアップロードして統一感を出す');

  if (tips.length === 0) {
    tips.push('詳細は元の記事をご確認ください');
  }

  // 記事タイプと重要度を推測
  let articleType: ArticleType = 'news';
  let priority: Priority = 'medium';
  if (text.includes('設定') || text.includes('方法') || text.includes('手順') || text.includes('tips') || text.includes('コツ')) {
    articleType = 'hack';
    priority = 'high';
  } else if (text.includes('新機能') || text.includes('リリース') || text.includes('アップデート') || text.includes('new feature')) {
    articleType = 'new_feature';
    priority = 'high';
  } else if (text.includes('ai')) {
    articleType = 'ai';
    priority = 'medium';
  }

  return {
    title,
    summary,
    category,
    tips: tips.slice(0, 3),
    priority,
    articleType,
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
    priority: summary.priority,
    articleType: summary.articleType,
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
