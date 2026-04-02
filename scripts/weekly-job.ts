#!/usr/bin/env npx ts-node

/**
 * 週次実行スクリプト
 *
 * 使用方法:
 *   npx ts-node scripts/weekly-job.ts
 *
 * cron設定例（毎週月曜日 9:00）:
 *   0 9 * * 1 cd /path/to/zoom-tips-collector && npx ts-node scripts/weekly-job.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// 環境変数を読み込み
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { runWeeklyJob } from '../src/lib/scheduler/cron';

async function main() {
  console.log('═'.repeat(60));
  console.log('  Zoom Tips Collector - 週次実行ジョブ');
  console.log('  実行日時:', new Date().toLocaleString('ja-JP'));
  console.log('═'.repeat(60));
  console.log();

  try {
    const result = await runWeeklyJob({
      useMock: !process.env.OPENAI_API_KEY, // APIキーがない場合はモック
      postToSlack: !!process.env.SLACK_BOT_TOKEN, // Slackトークンがある場合のみ投稿
      saveToFile: true,
    });

    console.log();
    console.log('═'.repeat(60));
    console.log('  実行結果サマリー');
    console.log('═'.repeat(60));
    console.log(`  - 収集コンテンツ数: ${result.rawContents.length}`);
    console.log(`  - 生成記事数: ${result.articles.length}`);
    console.log(`  - ハイライト数: ${result.digest.highlights.length}`);
    if (result.slackMessageId) {
      console.log(`  - Slack投稿ID: ${result.slackMessageId}`);
    }
    console.log('═'.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

main();
