import Parser from 'rss-parser';
import { RawContent, DEFAULT_CONFIG } from '../types';
import { generateId } from '../utils';

const parser = new Parser({
  customFields: {
    item: ['content:encoded', 'dc:creator'],
  },
});

/**
 * RSSフィードから記事を取得する
 */
export async function fetchRSSFeeds(
  feeds: string[] = DEFAULT_CONFIG.rss.feeds,
  maxItems: number = DEFAULT_CONFIG.rss.maxItems
): Promise<RawContent[]> {
  const results: RawContent[] = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);

      const items = feed.items.slice(0, maxItems);

      for (const item of items) {
        if (!item.title || !item.link) continue;

        const content: RawContent = {
          id: generateId('rss'),
          source: 'rss',
          title: item.title,
          content: item['content:encoded'] || item.contentSnippet || item.content || '',
          url: item.link,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          author: item['dc:creator'] || item.creator,
          tags: item.categories,
        };

        results.push(content);
      }
    } catch (error) {
      console.error(`RSS取得エラー (${feedUrl}):`, error);
    }
  }

  return results;
}

/**
 * モック用のRSSデータを生成
 */
export function getMockRSSData(): RawContent[] {
  const mockArticles: RawContent[] = [
    {
      id: generateId('rss'),
      source: 'rss',
      title: 'Zoom 6.0: AI機能が大幅強化！ミーティング要約が自動生成可能に',
      content: `
        Zoomの最新アップデートでは、AIを活用した新機能が多数追加されました。
        特に注目すべきは、ミーティング後に自動で要約を生成する機能です。
        この機能により、会議に参加できなかったメンバーも、重要なポイントを
        素早く把握できるようになります。

        主な新機能:
        - AIによるミーティング要約の自動生成
        - リアルタイム翻訳の対応言語追加（日本語含む）
        - スマートチャプター機能でレコーディングを効率的に閲覧
      `,
      url: 'https://blog.zoom.us/zoom-6-0-ai-features/',
      publishedAt: new Date('2024-03-15'),
      author: 'Zoom Team',
      tags: ['AI', 'New Features', 'Productivity'],
    },
    {
      id: generateId('rss'),
      source: 'rss',
      title: 'Zoomのセキュリティ設定ベストプラクティス2024',
      content: `
        リモートワークが定着する中、Zoomミーティングのセキュリティ対策は
        ますます重要になっています。このガイドでは、最新のセキュリティ
        設定とベストプラクティスをご紹介します。

        推奨設定:
        - 待機室の有効化
        - パスコードの必須化
        - 認証されたユーザーのみ参加可能に設定
        - 画面共有権限をホストのみに制限
      `,
      url: 'https://blog.zoom.us/security-best-practices-2024/',
      publishedAt: new Date('2024-03-10'),
      author: 'Security Team',
      tags: ['Security', 'Best Practices'],
    },
    {
      id: generateId('rss'),
      source: 'rss',
      title: 'Zoom Team ChatとSlackの連携方法',
      content: `
        ZoomとSlackを連携させることで、コミュニケーションツール間の
        切り替えを減らし、業務効率を向上させることができます。

        連携でできること:
        - SlackからワンクリックでZoomミーティングを開始
        - Zoomミーティングの予定をSlackで通知
        - Zoom Team Chatのメッセージをslackに転送
      `,
      url: 'https://blog.zoom.us/zoom-slack-integration/',
      publishedAt: new Date('2024-03-05'),
      author: 'Product Team',
      tags: ['Integration', 'Slack', 'Productivity'],
    },
    {
      id: generateId('rss'),
      source: 'rss',
      title: 'ブレイクアウトルームを活用した効果的なワークショップ運営',
      content: `
        オンラインワークショップやトレーニングで、参加者のエンゲージメントを
        高めるためのブレイクアウトルーム活用テクニックをご紹介します。

        Tips:
        - 事前にブレイクアウトルームを設定しておく
        - タイマー機能で時間管理
        - ブロードキャスト機能で全体への指示
        - 共同ホストを各ルームに配置
      `,
      url: 'https://blog.zoom.us/breakout-rooms-workshop/',
      publishedAt: new Date('2024-03-01'),
      author: 'Education Team',
      tags: ['Meeting', 'Tips', 'Workshop'],
    },
    {
      id: generateId('rss'),
      source: 'rss',
      title: 'Zoom Whiteboard新機能: テンプレートライブラリが拡充',
      content: `
        Zoom Whiteboardに新しいテンプレートが追加されました。
        ブレインストーミング、プロジェクト計画、レトロスペクティブなど、
        様々なユースケースに対応したテンプレートが利用可能です。

        新テンプレート:
        - アジャイルスプリントボード
        - SWOT分析
        - カスタマージャーニーマップ
        - マインドマップ
      `,
      url: 'https://blog.zoom.us/whiteboard-templates/',
      publishedAt: new Date('2024-02-28'),
      author: 'Product Team',
      tags: ['Whiteboard', 'Productivity', 'Collaboration'],
    },
  ];

  return mockArticles;
}
