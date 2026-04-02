import Parser from 'rss-parser';
import { RawContent } from '../types';
import { generateId } from '../utils';

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: ['content:encoded', 'dc:creator', 'media:content'],
  },
});

// 実際に取得可能なRSSフィード
const RSS_FEEDS = [
  'https://www.zdnet.com/topic/zoom/rss.xml',
  'https://techcrunch.com/tag/zoom/feed/',
  'https://www.theverge.com/rss/index.xml',
  'https://feeds.feedburner.com/Techcrunch',
];

/**
 * RSSフィードから記事を取得する
 */
export async function fetchRSSFeeds(
  feeds: string[] = RSS_FEEDS,
  maxItems: number = 5
): Promise<RawContent[]> {
  const results: RawContent[] = [];

  for (const feedUrl of feeds) {
    try {
      console.log(`  Fetching: ${feedUrl}`);
      const feed = await parser.parseURL(feedUrl);

      const items = feed.items
        .filter(item => {
          const text = ((item.title || '') + (item.contentSnippet || '')).toLowerCase();
          return text.includes('zoom') || text.includes('video call') || text.includes('remote work') || text.includes('slack');
        })
        .slice(0, maxItems);

      for (const item of items) {
        if (!item.title || !item.link) continue;

        const content: RawContent = {
          id: generateId('rss'),
          source: 'rss',
          title: item.title,
          content: item['content:encoded'] || item.contentSnippet || item.content || '',
          url: item.link,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          author: item['dc:creator'] || item.creator || feed.title,
          tags: item.categories || [],
        };

        results.push(content);
      }
      console.log(`    -> ${items.length}件取得`);
    } catch (error) {
      console.error(`  RSS取得エラー (${feedUrl}):`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // RSSから取得できなかった場合はモックデータを返す
  if (results.length === 0) {
    console.log('  -> RSSから取得できなかったためモックデータを使用');
    return getMockRSSData();
  }

  return results;
}

/**
 * モック用のRSSデータを生成
 */
export function getMockRSSData(): RawContent[] {
  const now = new Date();
  const mockArticles: RawContent[] = [
    {
      id: generateId('rss'),
      source: 'rss',
      title: 'Zoom AI Companion 2.0: 会議の自動要約と次のアクション抽出機能',
      content: `
        Zoomの最新AIアップデートでは、会議終了後に自動で要約を生成し、
        次のアクションアイテムを抽出する機能が追加されました。

        主な機能:
        - ミーティング要約の自動生成
        - アクションアイテムの自動抽出
        - 参加者への自動共有
        - 40以上の言語に対応
      `,
      url: 'https://blog.zoom.us/ai-companion-2-0/',
      publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      author: 'Zoom Team',
      tags: ['AI', 'Productivity'],
    },
    {
      id: generateId('rss'),
      source: 'rss',
      title: 'Zoom Workplace: オールインワンのコラボレーションプラットフォーム',
      content: `
        Zoom Workplaceは、ミーティング、チャット、電話、ホワイトボード、
        ドキュメントを統合したプラットフォームです。

        特徴:
        - AI搭載のスマート検索
        - チーム間のシームレスな連携
        - サードパーティアプリとの統合
      `,
      url: 'https://blog.zoom.us/zoom-workplace/',
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      author: 'Zoom Team',
      tags: ['Workplace', 'Collaboration'],
    },
    {
      id: generateId('rss'),
      source: 'rss',
      title: 'ハイブリッドワーク時代のZoom Rooms活用法',
      content: `
        オフィスとリモートの両方で働くハイブリッドワーク環境で、
        Zoom Roomsを最大限に活用する方法を紹介します。

        ベストプラクティス:
        - スマートギャラリーで全員を平等に表示
        - ワイヤレス画面共有の設定
        - 予約システムとの連携
      `,
      url: 'https://blog.zoom.us/hybrid-work-zoom-rooms/',
      publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      author: 'Zoom Team',
      tags: ['Hybrid Work', 'Zoom Rooms'],
    },
    {
      id: generateId('rss'),
      source: 'rss',
      title: 'Zoom x Slack連携の新機能: ワークフロー自動化',
      content: `
        ZoomとSlackの連携がさらに強化され、ワークフローの自動化が可能になりました。

        新機能:
        - Slackからのワンクリックミーティング開始
        - 会議終了後の自動サマリー投稿
        - スケジュール連携の強化
      `,
      url: 'https://blog.zoom.us/zoom-slack-workflow/',
      publishedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      author: 'Zoom Team',
      tags: ['Integration', 'Slack', 'Automation'],
    },
    {
      id: generateId('rss'),
      source: 'rss',
      title: 'Zoomセキュリティアップデート 2024: E2E暗号化の拡張',
      content: `
        Zoomのセキュリティ機能が強化され、より多くの機能で
        エンドツーエンド暗号化が利用可能になりました。

        対象機能:
        - グループミーティング
        - Zoom Phone
        - Zoom Rooms
        - ウェビナー
      `,
      url: 'https://blog.zoom.us/security-update-2024/',
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      author: 'Security Team',
      tags: ['Security', 'Encryption'],
    },
  ];

  return mockArticles;
}
