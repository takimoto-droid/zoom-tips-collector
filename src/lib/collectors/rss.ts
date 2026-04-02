import Parser from 'rss-parser';
import { RawContent } from '../types';
import { generateId } from '../utils';

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: ['content:encoded', 'dc:creator', 'media:content'],
  },
});

// RSSフィード一覧（動作確認済み）
const RSS_FEEDS = [
  // 日本語ソース
  { url: 'https://rss.itmedia.co.jp/rss/2.0/itmedia_all.xml', name: 'ITmedia' },
  { url: 'https://rss.itmedia.co.jp/rss/2.0/aiplus.xml', name: 'ITmedia AI+' },
  { url: 'https://rss.itmedia.co.jp/rss/2.0/enterprise.xml', name: 'ITmedia エンタープライズ' },
  { url: 'https://b.hatena.ne.jp/search/tag?q=Zoom&mode=rss', name: 'はてなブックマーク' },
  { url: 'https://news.google.com/rss/search?q=Zoom+テレワーク&hl=ja&gl=JP&ceid=JP:ja', name: 'Google News JP' },
  // 英語ソース
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch' },
  { url: 'https://feeds.feedburner.com/Techcrunch', name: 'TechCrunch FB' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge' },
];

// Zoom/リモートワーク関連のキーワード
const KEYWORDS = [
  'zoom', 'ズーム', 'リモートワーク', 'テレワーク', 'オンライン会議',
  'ビデオ会議', 'web会議', 'ウェブ会議', 'slack', 'teams', 'microsoft teams',
  '在宅勤務', 'ハイブリッドワーク', 'hybrid work', 'video call', 'remote work',
  'ai会議', 'ai議事録', '会議効率化', 'オンラインミーティング', 'webinar',
  'ウェビナー', 'バーチャル背景', 'virtual background',
];

/**
 * テキストがキーワードを含むかチェック
 */
function containsKeyword(text: string): boolean {
  const lowerText = text.toLowerCase();
  return KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * RSSフィードから記事を取得する
 */
export async function fetchRSSFeeds(maxItemsPerFeed: number = 10): Promise<RawContent[]> {
  const results: RawContent[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`  📡 ${feed.name} を取得中...`);
      const data = await parser.parseURL(feed.url);

      const items = data.items
        .filter(item => {
          const text = ((item.title || '') + (item.contentSnippet || '') + (item.content || '')).toLowerCase();
          return containsKeyword(text);
        })
        .slice(0, maxItemsPerFeed);

      for (const item of items) {
        if (!item.title || !item.link) continue;

        const content: RawContent = {
          id: generateId('rss'),
          source: 'rss',
          title: item.title.trim(),
          content: item['content:encoded'] || item.contentSnippet || item.content || '',
          url: item.link,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          author: item['dc:creator'] || item.creator || feed.name,
          tags: item.categories || [],
        };

        results.push(content);
      }

      if (items.length > 0) {
        console.log(`    ✅ ${items.length}件取得`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'エラー';
      // タイムアウトやネットワークエラーは簡潔に表示
      if (msg.includes('timeout') || msg.includes('ENOTFOUND')) {
        console.log(`    ⏱️ ${feed.name}: タイムアウト`);
      } else if (!msg.includes('404')) {
        console.log(`    ⚠️ ${feed.name}: ${msg.substring(0, 50)}`);
      }
    }
  }

  // 取得記事が少ない場合はモックデータを追加
  if (results.length < 5) {
    console.log('  📦 モックデータを追加');
    results.push(...getMockRSSData());
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
      title: 'Zoom AI Companion 2.0で会議の生産性が向上',
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
      author: 'ITmedia',
      tags: ['AI', '生産性'],
    },
    {
      id: generateId('rss'),
      source: 'rss',
      title: 'テレワーク時代のZoom活用術：効率的な会議運営のコツ',
      content: `
        テレワークが定着する中、Zoomを使った効率的な会議運営が求められています。

        ポイント:
        - アジェンダを事前共有
        - ブレイクアウトルームの活用
        - 録画機能で議事録作成を効率化
        - バーチャル背景で環境を整える
      `,
      url: 'https://www.itmedia.co.jp/zoom-tips/',
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      author: 'ITmedia',
      tags: ['テレワーク', 'Tips'],
    },
    {
      id: generateId('rss'),
      source: 'rss',
      title: 'Slack×Zoom連携の新機能でワークフロー自動化',
      content: `
        ZoomとSlackの連携がさらに強化され、ワークフローの自動化が可能になりました。

        新機能:
        - Slackからのワンクリックミーティング開始
        - 会議終了後の自動サマリー投稿
        - スケジュール連携の強化
      `,
      url: 'https://japan.cnet.com/zoom-slack/',
      publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      author: 'CNET Japan',
      tags: ['連携', 'Slack'],
    },
    {
      id: generateId('rss'),
      source: 'rss',
      title: 'ハイブリッドワーク時代のオンライン会議ベストプラクティス',
      content: `
        オフィスとリモートの両方で働くハイブリッドワーク環境では、
        オンライン会議の質が業務効率を左右します。

        ベストプラクティス:
        - 全員がオンラインで参加する形式を基本に
        - 会議室のカメラ・マイク設定を最適化
        - チャット機能を積極活用
      `,
      url: 'https://www.watch.impress.co.jp/hybrid-work/',
      publishedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      author: 'Impress Watch',
      tags: ['ハイブリッドワーク', 'Tips'],
    },
    {
      id: generateId('rss'),
      source: 'rss',
      title: '2024年版 Zoomセキュリティ設定ガイド',
      content: `
        Zoomのセキュリティ機能が強化され、より安全な会議運営が可能になりました。

        推奨設定:
        - 待機室の有効化
        - パスコードの必須化
        - E2E暗号化の有効化
        - 参加者の認証設定
      `,
      url: 'https://www.itmedia.co.jp/zoom-security/',
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      author: 'ITmedia',
      tags: ['セキュリティ'],
    },
  ];

  return mockArticles;
}
