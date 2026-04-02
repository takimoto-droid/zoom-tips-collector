import { promises as fs } from 'fs';
import path from 'path';
import { Article, WeeklyDigest } from './types';

// データファイルのパス
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');
const DIGEST_FILE = path.join(DATA_DIR, 'digest.json');

/**
 * データディレクトリの存在確認・作成
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * 記事一覧を保存
 */
export async function saveArticles(articles: Article[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(ARTICLES_FILE, JSON.stringify(articles, null, 2), 'utf-8');
}

/**
 * 記事一覧を読み込み
 */
export async function loadArticles(): Promise<Article[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(ARTICLES_FILE, 'utf-8');
    return JSON.parse(data) as Article[];
  } catch {
    return [];
  }
}

/**
 * 週次ダイジェストを保存
 */
export async function saveDigest(digest: WeeklyDigest): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DIGEST_FILE, JSON.stringify(digest, null, 2), 'utf-8');
}

/**
 * 週次ダイジェストを読み込み
 */
export async function loadDigest(): Promise<WeeklyDigest | null> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DIGEST_FILE, 'utf-8');
    return JSON.parse(data) as WeeklyDigest;
  } catch {
    return null;
  }
}

/**
 * 記事を追加（既存データとマージ）
 */
export async function addArticles(newArticles: Article[]): Promise<Article[]> {
  const existingArticles = await loadArticles();

  // URLベースで重複除去
  const existingUrls = new Set(existingArticles.map((a) => a.originalUrl));
  const uniqueNewArticles = newArticles.filter((a) => !existingUrls.has(a.originalUrl));

  // マージして新しい順にソート
  const merged = [...uniqueNewArticles, ...existingArticles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  await saveArticles(merged);
  return merged;
}

/**
 * 記事をカテゴリでフィルタ
 */
export async function getArticlesByCategory(category: string): Promise<Article[]> {
  const articles = await loadArticles();
  if (category === 'all') return articles;
  return articles.filter((a) => a.category === category);
}

/**
 * 最新N件の記事を取得
 */
export async function getRecentArticles(limit: number = 10): Promise<Article[]> {
  const articles = await loadArticles();
  return articles.slice(0, limit);
}

/**
 * 記事を検索
 */
export async function searchArticles(query: string): Promise<Article[]> {
  const articles = await loadArticles();
  const lowerQuery = query.toLowerCase();

  return articles.filter(
    (a) =>
      a.title.toLowerCase().includes(lowerQuery) ||
      a.summary.toLowerCase().includes(lowerQuery) ||
      a.tips.some((t) => t.toLowerCase().includes(lowerQuery))
  );
}

/**
 * 統計情報を取得
 */
export async function getStats(): Promise<{
  totalArticles: number;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  lastUpdated: string | null;
}> {
  const articles = await loadArticles();

  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  for (const article of articles) {
    byCategory[article.category] = (byCategory[article.category] || 0) + 1;
    bySource[article.source] = (bySource[article.source] || 0) + 1;
  }

  return {
    totalArticles: articles.length,
    byCategory,
    bySource,
    lastUpdated: articles.length > 0 ? articles[0].createdAt : null,
  };
}
