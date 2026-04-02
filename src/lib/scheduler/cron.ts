import { fetchRSSFeeds, getMockRSSData } from '../collectors/rss';
import { getMockScrapedData } from '../collectors/scraper';
import { getMockTwitterData, searchMultipleQueries } from '../collectors/twitter';
import { processMultipleContents, generateWeeklyDigest } from '../ai/openai';
import { postDigestToSlack, previewSlackMessage, formatDigestForSlack } from '../slack/bot';
import { RawContent, Article, WeeklyDigest } from '../types';
import { deduplicateById } from '../utils';
import { saveArticles, loadArticles } from '../storage';

export interface CollectionResult {
  rawContents: RawContent[];
  articles: Article[];
  digest: WeeklyDigest;
  slackMessageId?: string;
}

/**
 * 全ソースから情報を収集
 */
export async function collectAllSources(useMock: boolean = true): Promise<RawContent[]> {
  console.log('📡 情報収集を開始します...');
  const allContents: RawContent[] = [];

  // RSS収集
  console.log('  - RSS フィードを取得中...');
  if (useMock) {
    allContents.push(...getMockRSSData());
  } else {
    const rssContents = await fetchRSSFeeds();
    allContents.push(...rssContents);
  }

  // Webスクレイピング（モックデータを使用）
  console.log('  - Webページ情報を追加中...');
  if (useMock) {
    allContents.push(...getMockScrapedData());
  }

  // Twitter検索
  console.log('  - X (Twitter) を検索中...');
  if (useMock || !process.env.TWITTER_BEARER_TOKEN) {
    allContents.push(...getMockTwitterData());
  } else {
    const tweets = await searchMultipleQueries();
    allContents.push(...tweets);
  }

  console.log(`✅ ${allContents.length}件のコンテンツを収集しました`);

  return allContents;
}

/**
 * 収集・処理・投稿の一連の処理を実行
 */
export async function runWeeklyJob(options: {
  useMock?: boolean;
  postToSlack?: boolean;
  saveToFile?: boolean;
} = {}): Promise<CollectionResult> {
  const { useMock = true, postToSlack: shouldPost = false, saveToFile = true } = options;

  console.log('🚀 週次ジョブを開始します');
  console.log('━'.repeat(50));

  // 1. 情報収集
  const rawContents = await collectAllSources(useMock);

  // 2. 重複除去
  console.log('\n🔄 重複を除去中...');
  const uniqueContents = deduplicateById(rawContents);
  console.log(`  - ${rawContents.length}件 → ${uniqueContents.length}件`);

  // 3. AI処理（要約・カテゴリ分類）
  console.log('\n🤖 AI処理中...');
  const articles = await processMultipleContents(uniqueContents);
  console.log(`  - ${articles.length}件の記事を生成しました`);

  // 4. 週次ダイジェスト生成
  console.log('\n📊 週次ダイジェストを生成中...');
  const digest = await generateWeeklyDigest(articles);
  console.log(`  - ハイライト: ${digest.highlights.length}件`);

  // 5. ファイルに保存
  if (saveToFile) {
    console.log('\n💾 ファイルに保存中...');
    await saveArticles(articles);
    console.log('  - 保存完了');
  }

  // 6. Slack投稿
  let slackMessageId: string | undefined;
  if (shouldPost) {
    console.log('\n📤 Slackに投稿中...');
    const messageId = await postDigestToSlack(digest);
    if (messageId) {
      slackMessageId = messageId;
      console.log(`  - 投稿成功: ${messageId}`);
    }
  } else {
    // プレビュー表示
    console.log('\n📝 Slackメッセージプレビュー:');
    const message = formatDigestForSlack(digest);
    console.log(previewSlackMessage(message));
  }

  console.log('\n━'.repeat(50));
  console.log('✅ 週次ジョブが完了しました');

  return {
    rawContents: uniqueContents,
    articles,
    digest,
    slackMessageId,
  };
}

/**
 * 手動収集トリガー（API用）
 */
export async function manualCollect(options: {
  useMock?: boolean;
} = {}): Promise<Article[]> {
  const { useMock = true } = options;

  // 情報収集
  const rawContents = await collectAllSources(useMock);

  // 重複除去
  const uniqueContents = deduplicateById(rawContents);

  // AI処理
  const articles = await processMultipleContents(uniqueContents);

  // 保存
  await saveArticles(articles);

  return articles;
}

/**
 * 既存の記事と新しい記事をマージ
 */
export async function mergeWithExisting(newArticles: Article[]): Promise<Article[]> {
  const existingArticles = await loadArticles();

  // URLベースで重複除去
  const existingUrls = new Set(existingArticles.map((a) => a.originalUrl));
  const uniqueNewArticles = newArticles.filter((a) => !existingUrls.has(a.originalUrl));

  // マージして新しい順にソート
  const merged = [...uniqueNewArticles, ...existingArticles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return merged;
}
