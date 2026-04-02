import { WebClient } from '@slack/web-api';
import { Article, WeeklyDigest, SlackMessage, CATEGORY_LABELS } from '../types';
import { formatDateJa, truncate } from '../utils';

// Slack クライアントの初期化
function getSlackClient(): WebClient | null {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn('SLACK_BOT_TOKEN が設定されていません');
    return null;
  }
  return new WebClient(token);
}

/**
 * 記事をSlackメッセージフォーマットに変換
 */
export function formatArticleForSlack(article: Article): SlackMessage {
  const categoryLabel = CATEGORY_LABELS[article.category];
  const channelId = process.env.SLACK_CHANNEL_ID || 'general';

  return {
    channel: channelId,
    text: `${categoryLabel} ${article.title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${categoryLabel} ${article.title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: article.summary,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*💡 実践Tips:*\n' + article.tips.map((tip) => `• ${tip}`).join('\n'),
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `📅 ${formatDateJa(article.publishedAt)} | 📰 ${article.source.toUpperCase()}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ' ',
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '元記事を読む',
            emoji: true,
          },
          url: article.originalUrl,
          action_id: 'read_original',
        },
      },
      {
        type: 'divider',
      },
    ],
  };
}

/**
 * 週次ダイジェストをSlackメッセージフォーマットに変換
 */
export function formatDigestForSlack(digest: WeeklyDigest): SlackMessage {
  const channelId = process.env.SLACK_CHANNEL_ID || 'general';

  const blocks: SlackMessage['blocks'] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📬 今週のZoom Tips ダイジェスト',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${digest.weekStart} 〜 ${digest.weekEnd}*\n\n今週は *${digest.articles.length}件* の新しい情報を収集しました！`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*✨ 今週のハイライト*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: digest.highlights.map((h, i) => `${i + 1}. ${h}`).join('\n'),
      },
    },
    {
      type: 'divider',
    },
  ];

  // カテゴリ別に記事を追加
  const categoryGroups = digest.articles.reduce(
    (acc, article) => {
      if (!acc[article.category]) {
        acc[article.category] = [];
      }
      acc[article.category].push(article);
      return acc;
    },
    {} as Record<string, Article[]>
  );

  for (const [category, articles] of Object.entries(categoryGroups)) {
    const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category;

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${label}* (${articles.length}件)`,
      },
    });

    for (const article of articles.slice(0, 3)) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `• <${article.originalUrl}|${truncate(article.title, 50)}>`,
        },
      });
    }
  }

  blocks.push({
    type: 'divider',
  });

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
    text: `今週のZoom Tips ダイジェスト（${digest.articles.length}件）`,
    blocks,
  };
}

/**
 * Slackにメッセージを投稿
 */
export async function postToSlack(message: SlackMessage): Promise<string | null> {
  const client = getSlackClient();

  if (!client) {
    console.log('=== Slack投稿プレビュー ===');
    console.log(JSON.stringify(message, null, 2));
    console.log('=========================');
    return null;
  }

  try {
    const result = await client.chat.postMessage({
      channel: message.channel,
      text: message.text,
      blocks: message.blocks,
    });

    console.log(`Slack投稿成功: ${result.ts}`);
    return result.ts as string;
  } catch (error) {
    console.error('Slack投稿エラー:', error);
    throw error;
  }
}

/**
 * 単一の記事をSlackに投稿
 */
export async function postArticleToSlack(article: Article): Promise<string | null> {
  const message = formatArticleForSlack(article);
  return postToSlack(message);
}

/**
 * 週次ダイジェストをSlackに投稿
 */
export async function postDigestToSlack(digest: WeeklyDigest): Promise<string | null> {
  const message = formatDigestForSlack(digest);
  return postToSlack(message);
}

/**
 * テスト用: Slackメッセージのプレビューを生成
 */
export function previewSlackMessage(message: SlackMessage): string {
  let preview = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  preview += '📱 Slack メッセージプレビュー\n';
  preview += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  for (const block of message.blocks) {
    switch (block.type) {
      case 'header':
        preview += `【 ${block.text?.text} 】\n\n`;
        break;
      case 'section':
        if (block.text?.text && block.text.text !== ' ') {
          preview += `${block.text.text}\n\n`;
        }
        if (block.accessory?.text?.text) {
          preview += `[${block.accessory.text.text}](${block.accessory.url})\n\n`;
        }
        break;
      case 'context':
        if (block.elements) {
          for (const element of block.elements) {
            if (element.text) {
              preview += `_${element.text}_\n`;
            }
          }
        }
        preview += '\n';
        break;
      case 'divider':
        preview += '────────────────────────────────────────\n\n';
        break;
    }
  }

  return preview;
}
