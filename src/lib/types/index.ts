// 収集元のソースタイプ
export type SourceType = 'rss' | 'web' | 'twitter' | 'api';

// カテゴリ
export type Category =
  | 'meeting'      // ミーティング機能
  | 'chat'         // チャット機能
  | 'security'     // セキュリティ
  | 'integration'  // 連携機能
  | 'productivity' // 生産性向上
  | 'other';       // その他

// 収集した生データ
export interface RawContent {
  id: string;
  source: SourceType;
  title: string;
  content: string;
  url: string;
  publishedAt: Date;
  author?: string;
  tags?: string[];
}

// 処理済み記事
export interface Article {
  id: string;
  title: string;
  summary: string;
  category: Category;
  tips: string[];
  originalUrl: string;
  source: SourceType;
  publishedAt: string;
  createdAt: string;
  slackMessageId?: string;
}

// Slack投稿用フォーマット
export interface SlackMessage {
  channel: string;
  text: string;
  blocks: SlackBlock[];
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: SlackBlockElement[];
  accessory?: {
    type: string;
    text?: { type: string; text: string; emoji?: boolean };
    url?: string;
    action_id?: string;
  };
}

export interface SlackBlockElement {
  type: string;
  text?: string;
  url?: string;
}

// OpenAI API レスポンス用
export interface ArticleSummary {
  title: string;
  summary: string;
  category: Category;
  tips: string[];
}

// 週次ダイジェスト
export interface WeeklyDigest {
  weekStart: string;
  weekEnd: string;
  articles: Article[];
  highlights: string[];
  generatedAt: string;
}

// API レスポンス
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 収集設定
export interface CollectorConfig {
  rss: {
    feeds: string[];
    maxItems: number;
  };
  twitter: {
    queries: string[];
    maxTweets: number;
  };
  scraper: {
    urls: string[];
  };
}

// デフォルト設定
export const DEFAULT_CONFIG: CollectorConfig = {
  rss: {
    feeds: [
      'https://blog.zoom.us/feed/',
      'https://news.zoom.us/feed/',
    ],
    maxItems: 10,
  },
  twitter: {
    queries: [
      'Zoom tips',
      'Zoom 新機能',
      'Zoom productivity',
      '#ZoomTips',
    ],
    maxTweets: 20,
  },
  scraper: {
    urls: [
      'https://support.zoom.us/hc/en-us/articles/new',
      'https://zoom.us/docs/en-us/release-notes.html',
    ],
  },
};

// カテゴリ表示名
export const CATEGORY_LABELS: Record<Category, string> = {
  meeting: '📹 ミーティング',
  chat: '💬 チャット',
  security: '🔒 セキュリティ',
  integration: '🔗 連携',
  productivity: '⚡ 生産性向上',
  other: '📌 その他',
};

// カテゴリの色（Tailwind CSS用）
export const CATEGORY_COLORS: Record<Category, string> = {
  meeting: 'bg-blue-100 text-blue-800',
  chat: 'bg-green-100 text-green-800',
  security: 'bg-red-100 text-red-800',
  integration: 'bg-purple-100 text-purple-800',
  productivity: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800',
};
