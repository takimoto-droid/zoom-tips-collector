# Zoom Tips Collector

Zoom/Slack業務効率化Tipsを自動収集・共有するシステム

## 概要

このシステムは、Zoomに関する最新情報やTipsを自動的に収集し、Slackに共有するためのツールです。

### 主な機能

- **情報収集**: RSSフィード、Webスクレイピング、X (Twitter) APIから情報を収集
- **AI処理**: OpenAI APIを使用して記事を要約・カテゴリ分類
- **Slack投稿**: 週次ダイジェストをSlackチャンネルに自動投稿
- **ダッシュボード**: 収集した記事をブラウザで閲覧

## システム構成

```
情報収集レイヤー
├── RSS Parser (Zoom Blog)
├── Web Scraper (Release Notes)
├── X API (Twitter検索)
└── 外部API (Zapier/Make)
         ↓
データ処理レイヤー
├── データ正規化
├── 重複排除
└── カテゴリ分類
         ↓
AI処理レイヤー
├── OpenAI API
├── 要約生成
└── 記事フォーマット化
         ↓
配信レイヤー
├── Slack Bot投稿 (#zoom-tips)
└── Next.js Dashboard (localhost:3000)
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集して各APIキーを設定:

```
# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key

# X (Twitter) API
TWITTER_BEARER_TOKEN=your-twitter-bearer-token

# Slack Bot
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=C0123456789
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でダッシュボードにアクセスできます。

## 使い方

### ダッシュボード

1. http://localhost:3000 にアクセス
2. 「情報を収集」ボタンをクリックして最新情報を取得
3. カテゴリタブで記事をフィルタリング
4. 各記事カードから元記事へアクセス

### 手動収集（CLI）

```bash
npm run collect
```

### 週次自動実行（cron）

```bash
# 毎週月曜日 9:00 に実行
0 9 * * 1 cd /path/to/zoom-tips-collector && npm run collect
```

## API

### GET /api/articles

収集した記事一覧を取得

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "articles": [...],
    "stats": {
      "totalArticles": 10,
      "byCategory": { "meeting": 3, "security": 2, ... },
      "bySource": { "rss": 5, "twitter": 3, "web": 2 },
      "lastUpdated": "2024-03-18T10:00:00.000Z"
    }
  }
}
```

### POST /api/collect

情報収集を手動でトリガー

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "articles": [...],
    "count": 14
  }
}
```

### GET /api/preview

週次ダイジェストのSlack投稿プレビューを取得

## 外部API設定

### X (Twitter) API

1. https://developer.twitter.com/ でDeveloper Accountを作成
2. Projectを作成
3. App作成時にBearer Tokenを取得
4. 環境変数 `TWITTER_BEARER_TOKEN` に設定

### Slack Bot

1. https://api.slack.com/apps でApp作成
2. Bot Token Scopesを設定:
   - `chat:write`
   - `channels:read`
3. Workspaceにインストール
4. Bot User OAuth Tokenを取得
5. 環境変数 `SLACK_BOT_TOKEN` に設定
6. 投稿先チャンネルにBotを招待
7. チャンネルIDを `SLACK_CHANNEL_ID` に設定

### OpenAI API

1. https://platform.openai.com/ でアカウント作成
2. API Keyを発行
3. 環境変数 `OPENAI_API_KEY` に設定

## カテゴリ

| カテゴリ | 説明 |
|---------|------|
| meeting | ミーティング機能 |
| chat | チャット機能 |
| security | セキュリティ |
| integration | 連携機能 |
| productivity | 生産性向上 |
| other | その他 |

## ディレクトリ構成

```
zoom-tips-collector/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # ダッシュボード
│   │   ├── layout.tsx            # レイアウト
│   │   ├── globals.css           # グローバルスタイル
│   │   └── api/
│   │       ├── collect/route.ts  # 手動収集API
│   │       ├── articles/route.ts # 記事一覧API
│   │       └── preview/route.ts  # プレビューAPI
│   │
│   ├── lib/
│   │   ├── collectors/           # 情報収集モジュール
│   │   │   ├── rss.ts            # RSS取得
│   │   │   ├── scraper.ts        # Webスクレイピング
│   │   │   └── twitter.ts        # X API連携
│   │   │
│   │   ├── ai/
│   │   │   └── openai.ts         # OpenAI API連携
│   │   │
│   │   ├── slack/
│   │   │   └── bot.ts            # Slack Bot
│   │   │
│   │   ├── scheduler/
│   │   │   └── cron.ts           # スケジューラー
│   │   │
│   │   ├── types/
│   │   │   └── index.ts          # 型定義
│   │   │
│   │   ├── storage.ts            # データ永続化
│   │   └── utils.ts              # ユーティリティ
│   │
│   ├── components/               # UIコンポーネント
│   │   ├── ArticleCard.tsx       # 記事カード
│   │   ├── CategoryTabs.tsx      # カテゴリタブ
│   │   └── Dashboard.tsx         # ダッシュボード
│   │
│   └── data/
│       └── articles.json         # 記事保存先
│
├── scripts/
│   └── weekly-job.ts             # 週次実行スクリプト
│
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## デモモード

APIキーが設定されていない場合、システムは自動的にモックデータを使用します。
これにより、APIキーなしでもダッシュボードの動作を確認できます。

## 技術スタック

- **フレームワーク**: Next.js (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **AI**: OpenAI GPT-4o-mini
- **外部API**: X API v2, Slack Web API
- **その他**: rss-parser, cheerio, axios

## ライセンス

MIT
