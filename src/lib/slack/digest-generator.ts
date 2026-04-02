import { Article, Category, SlackDigestSummary, SlackMessage, CATEGORY_LABELS } from '../types';
import { formatDateJa, getWeekRange } from '../utils';

// ユースケース別のペルソナ定義
const PERSONAS = [
  { id: 'manager', name: 'マネージャー・リーダー', keywords: ['会議', 'チーム', '効率', '管理', '報告'] },
  { id: 'engineer', name: 'エンジニア・開発者', keywords: ['連携', 'API', '自動化', 'Slack', '開発'] },
  { id: 'sales', name: '営業・カスタマーサクセス', keywords: ['顧客', '商談', '録画', '共有', 'プレゼン'] },
  { id: 'hr', name: '人事・採用担当', keywords: ['面接', '研修', 'オンボーディング', 'トレーニング'] },
  { id: 'general', name: '全社員向け', keywords: ['基本', 'セキュリティ', '設定', '背景', 'Tips'] },
];

// キーワードからユースケースを抽出
function extractUseCaseFromArticle(article: Article): string {
  const text = (article.title + ' ' + article.summary + ' ' + article.tips.join(' ')).toLowerCase();

  if (text.includes('会議') || text.includes('ミーティング')) {
    return '会議の効率化・生産性向上に活用できます';
  }
  if (text.includes('ai') || text.includes('自動')) {
    return 'AI機能を活用した業務自動化に役立ちます';
  }
  if (text.includes('セキュリティ') || text.includes('security')) {
    return 'セキュリティ強化・リスク管理に重要です';
  }
  if (text.includes('slack') || text.includes('連携')) {
    return '他ツールとの連携でワークフローを改善できます';
  }
  if (text.includes('録画') || text.includes('共有')) {
    return '情報共有・ナレッジ蓄積に活用できます';
  }
  return '日常業務の効率化に活用できます';
}

// カテゴリ別のキーポイントを抽出
function extractKeyPoints(articles: Article[]): string[] {
  const points: string[] = [];
  const seen = new Set<string>();

  for (const article of articles) {
    for (const tip of article.tips) {
      const normalized = tip.substring(0, 30);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        points.push(tip);
      }
      if (points.length >= 3) break;
    }
    if (points.length >= 3) break;
  }

  return points;
}

// おすすめアクションを生成
function generateRecommendedActions(articles: Article[]): SlackDigestSummary['recommendedActions'] {
  const actions: SlackDigestSummary['recommendedActions'] = [];
  const categories = new Set(articles.map(a => a.category));

  if (categories.has('security')) {
    actions.push({
      action: 'セキュリティ設定を確認・更新',
      reason: '今週セキュリティ関連の更新情報があります',
      priority: 'high',
    });
  }

  if (categories.has('productivity')) {
    actions.push({
      action: 'AI機能の活用を検討',
      reason: '生産性向上に直結する新機能が紹介されています',
      priority: 'high',
    });
  }

  if (categories.has('integration')) {
    actions.push({
      action: '連携機能の設定を見直し',
      reason: 'ツール連携でワークフローを効率化できます',
      priority: 'medium',
    });
  }

  if (categories.has('meeting')) {
    actions.push({
      action: 'チームで会議ルールを共有',
      reason: '会議効率化のTipsを全員で実践しましょう',
      priority: 'medium',
    });
  }

  return actions.slice(0, 3);
}

// トレンドキーワードを抽出
function extractTrendingKeywords(articles: Article[]): string[] {
  const wordCount: Record<string, number> = {};
  const stopWords = ['の', 'を', 'に', 'が', 'は', 'で', 'と', 'する', 'した', 'して', 'ます', 'です', 'こと', 'これ', 'それ', 'あり'];

  for (const article of articles) {
    const text = article.title + ' ' + article.summary;
    const words = text.match(/[A-Za-z]+|[\u30A0-\u30FF]+|[\u4E00-\u9FFF]+/g) || [];

    for (const word of words) {
      if (word.length >= 2 && !stopWords.includes(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    }
  }

  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

// ペルソナ別Tipsを生成
function generatePersonaTips(articles: Article[]): SlackDigestSummary['useCaseTips'] {
  const result: SlackDigestSummary['useCaseTips'] = [];

  for (const persona of PERSONAS) {
    const relevantTips: string[] = [];

    for (const article of articles) {
      const text = (article.title + ' ' + article.summary + ' ' + article.tips.join(' ')).toLowerCase();
      const isRelevant = persona.keywords.some(kw => text.includes(kw.toLowerCase()));

      if (isRelevant) {
        for (const tip of article.tips) {
          if (!relevantTips.includes(tip) && relevantTips.length < 3) {
            relevantTips.push(tip);
          }
        }
      }
    }

    if (relevantTips.length > 0) {
      result.push({
        persona: persona.name,
        tips: relevantTips,
      });
    }
  }

  return result.slice(0, 4);
}

/**
 * 記事からSlack配信用まとめを生成
 */
export function generateSlackDigestSummary(
  articles: Article[],
  previousArticles: Article[] = []
): SlackDigestSummary {
  const { start, end } = getWeekRange();
  const period = `${formatDateJa(start)} 〜 ${formatDateJa(end)}`;

  // カテゴリ別に分類
  const categoryGroups: Record<Category, Article[]> = {
    meeting: [],
    chat: [],
    security: [],
    integration: [],
    productivity: [],
    other: [],
  };

  for (const article of articles) {
    categoryGroups[article.category].push(article);
  }

  // カテゴリ別サマリー
  const categoryBreakdown: SlackDigestSummary['categoryBreakdown'] = [];
  for (const [category, catArticles] of Object.entries(categoryGroups)) {
    if (catArticles.length > 0) {
      categoryBreakdown.push({
        category: category as Category,
        label: CATEGORY_LABELS[category as Category],
        count: catArticles.length,
        keyPoints: extractKeyPoints(catArticles),
      });
    }
  }
  categoryBreakdown.sort((a, b) => b.count - a.count);

  // トップハイライト（上位3件）
  const topArticles = articles.slice(0, 3);
  const topHighlights = topArticles.map(article => ({
    title: article.title,
    summary: article.summary,
    useCase: extractUseCaseFromArticle(article),
    url: article.originalUrl,
  }));

  // 前週との比較
  const previousUrls = new Set(previousArticles.map(a => a.originalUrl));
  const newArticles = articles.filter(a => !previousUrls.has(a.originalUrl));
  const newTopics = [...new Set(newArticles.flatMap(a => a.tips))].slice(0, 3);
  const trendingKeywords = extractTrendingKeywords(articles);

  let insights = '';
  if (categoryBreakdown.length > 0) {
    const topCategory = categoryBreakdown[0];
    insights = `今週は「${topCategory.label.replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\w\s]/g, '')}」関連の情報が${topCategory.count}件と最も多く、`;
    if (trendingKeywords.length > 0) {
      insights += `「${trendingKeywords.slice(0, 2).join('」「')}」がトレンドキーワードです。`;
    }
  }

  return {
    title: '📬 今週のZoom/Slack業務効率化Tips',
    period,
    totalArticles: articles.length,
    newArticles: newArticles.length,
    topHighlights,
    categoryBreakdown,
    recommendedActions: generateRecommendedActions(articles),
    comparison: {
      newTopics,
      trendingKeywords,
      insights,
    },
    useCaseTips: generatePersonaTips(articles),
  };
}

/**
 * Slack配信用まとめをSlackメッセージフォーマットに変換
 */
export function formatDigestSummaryForSlack(summary: SlackDigestSummary): SlackMessage {
  const channelId = process.env.SLACK_CHANNEL_ID || 'general';
  const blocks: SlackMessage['blocks'] = [];

  // ヘッダー
  blocks.push({
    type: 'header',
    text: { type: 'plain_text', text: summary.title, emoji: true },
  });

  // 期間と概要
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*📅 ${summary.period}*\n\n📊 *${summary.totalArticles}件* の情報を収集（新規: ${summary.newArticles}件）`,
    },
  });

  blocks.push({ type: 'divider' });

  // 今週のインサイト
  if (summary.comparison.insights) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*💡 今週のインサイト*\n${summary.comparison.insights}`,
      },
    });
    blocks.push({ type: 'divider' });
  }

  // トップハイライト
  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: '*✨ 今週の注目トピック*' },
  });

  for (const highlight of summary.topHighlights) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${highlight.url}|${highlight.title}>*\n${highlight.summary}\n_💼 ${highlight.useCase}_`,
      },
    });
  }

  blocks.push({ type: 'divider' });

  // おすすめアクション
  if (summary.recommendedActions.length > 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '*🎯 今週のおすすめアクション*' },
    });

    const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' };
    const actionText = summary.recommendedActions
      .map(a => `${priorityEmoji[a.priority]} *${a.action}*\n   └ ${a.reason}`)
      .join('\n\n');

    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: actionText },
    });

    blocks.push({ type: 'divider' });
  }

  // カテゴリ別サマリー
  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: '*📂 カテゴリ別サマリー*' },
  });

  for (const cat of summary.categoryBreakdown.slice(0, 4)) {
    const points = cat.keyPoints.length > 0 ? `\n   • ${cat.keyPoints.slice(0, 2).join('\n   • ')}` : '';
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${cat.label} (${cat.count}件)${points}`,
      },
    });
  }

  blocks.push({ type: 'divider' });

  // ユースケース別Tips
  if (summary.useCaseTips.length > 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '*👥 あなたの役割別おすすめTips*' },
    });

    for (const useCase of summary.useCaseTips.slice(0, 3)) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${useCase.persona}*\n${useCase.tips.map(t => `• ${t}`).join('\n')}`,
        },
      });
    }

    blocks.push({ type: 'divider' });
  }

  // トレンドキーワード
  if (summary.comparison.trendingKeywords.length > 0) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `🏷️ トレンド: ${summary.comparison.trendingKeywords.join(' / ')}`,
        },
      ],
    });
  }

  // フッター
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `🤖 自動生成 by Zoom Tips Collector | ${formatDateJa(new Date())}`,
      },
    ],
  });

  return {
    channel: channelId,
    text: `${summary.title}（${summary.totalArticles}件）`,
    blocks,
  };
}

/**
 * テキスト形式でプレビューを生成
 */
export function generateTextPreview(summary: SlackDigestSummary): string {
  let text = '';

  text += '═'.repeat(60) + '\n';
  text += `${summary.title}\n`;
  text += `📅 ${summary.period}\n`;
  text += '═'.repeat(60) + '\n\n';

  text += `📊 収集記事: ${summary.totalArticles}件（新規: ${summary.newArticles}件）\n\n`;

  if (summary.comparison.insights) {
    text += '💡 今週のインサイト\n';
    text += `${summary.comparison.insights}\n\n`;
  }

  text += '─'.repeat(60) + '\n';
  text += '✨ 今週の注目トピック\n';
  text += '─'.repeat(60) + '\n\n';

  for (const highlight of summary.topHighlights) {
    text += `▶ ${highlight.title}\n`;
    text += `  ${highlight.summary}\n`;
    text += `  💼 ${highlight.useCase}\n`;
    text += `  🔗 ${highlight.url}\n\n`;
  }

  text += '─'.repeat(60) + '\n';
  text += '🎯 今週のおすすめアクション\n';
  text += '─'.repeat(60) + '\n\n';

  const priorityLabel = { high: '【重要】', medium: '【推奨】', low: '【参考】' };
  for (const action of summary.recommendedActions) {
    text += `${priorityLabel[action.priority]} ${action.action}\n`;
    text += `   └ ${action.reason}\n\n`;
  }

  text += '─'.repeat(60) + '\n';
  text += '📂 カテゴリ別サマリー\n';
  text += '─'.repeat(60) + '\n\n';

  for (const cat of summary.categoryBreakdown) {
    text += `${cat.label} (${cat.count}件)\n`;
    for (const point of cat.keyPoints.slice(0, 2)) {
      text += `  • ${point}\n`;
    }
    text += '\n';
  }

  if (summary.useCaseTips.length > 0) {
    text += '─'.repeat(60) + '\n';
    text += '👥 役割別おすすめTips\n';
    text += '─'.repeat(60) + '\n\n';

    for (const useCase of summary.useCaseTips) {
      text += `【${useCase.persona}】\n`;
      for (const tip of useCase.tips) {
        text += `  • ${tip}\n`;
      }
      text += '\n';
    }
  }

  if (summary.comparison.trendingKeywords.length > 0) {
    text += '─'.repeat(60) + '\n';
    text += `🏷️ トレンドキーワード: ${summary.comparison.trendingKeywords.join(' / ')}\n`;
  }

  text += '\n' + '═'.repeat(60) + '\n';

  return text;
}
