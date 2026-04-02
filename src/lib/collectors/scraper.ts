import axios from 'axios';
import * as cheerio from 'cheerio';
import { RawContent } from '../types';
import { generateId } from '../utils';

/**
 * Webページから記事を取得する
 */
export async function scrapeWebPage(url: string): Promise<RawContent | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // メタデータを取得
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      'Untitled';

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';

    // 本文を取得（一般的なコンテンツセレクタ）
    const contentSelectors = [
      'article',
      '.post-content',
      '.article-content',
      '.entry-content',
      'main',
      '.content',
    ];

    let content = '';
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }

    if (!content) {
      content = description;
    }

    // 公開日を取得
    const publishedAt =
      $('meta[property="article:published_time"]').attr('content') ||
      $('time').attr('datetime') ||
      new Date().toISOString();

    return {
      id: generateId('web'),
      source: 'web',
      title: title.trim(),
      content: content,
      url: url,
      publishedAt: new Date(publishedAt),
    };
  } catch (error) {
    console.error(`スクレイピングエラー (${url}):`, error);
    return null;
  }
}

/**
 * 複数のURLからコンテンツを取得
 */
export async function scrapeMultipleUrls(urls: string[]): Promise<RawContent[]> {
  const results: RawContent[] = [];

  for (const url of urls) {
    const content = await scrapeWebPage(url);
    if (content) {
      results.push(content);
    }
    // レート制限対策
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Zoom Release Notesページをスクレイピング（モック）
 */
export function getMockScrapedData(): RawContent[] {
  const mockData: RawContent[] = [
    {
      id: generateId('web'),
      source: 'web',
      title: 'Zoom Desktop Client リリースノート - バージョン6.0.0',
      content: `
        【新機能】
        ・ AIコンパニオン機能の強化
          - ミーティング中のリアルタイム要約
          - アクションアイテムの自動抽出
          - スマートレコーディングチャプター

        ・ ミーティング機能の改善
          - 参加者上限の拡大（1000名まで）
          - バーチャル背景の品質向上
          - ノイズキャンセリングの精度向上

        【バグ修正】
        ・ 特定の条件でカメラが認識されない問題を修正
        ・ 画面共有時の音声遅延を改善
        ・ チャットの通知が表示されない問題を修正
      `,
      url: 'https://support.zoom.us/hc/en-us/articles/desktop-client-release-notes',
      publishedAt: new Date('2024-03-18'),
    },
    {
      id: generateId('web'),
      source: 'web',
      title: 'Zoom Rooms アップデート - ハイブリッドワーク対応強化',
      content: `
        Zoom Roomsの最新アップデートでは、ハイブリッドワーク環境を
        サポートする機能が大幅に強化されました。

        主なアップデート:
        - スマートギャラリー機能の改善（AIによる参加者の自動フレーミング）
        - 会議室予約システムとの連携強化
        - デジタルサイネージ機能の追加
        - タッチレス操作のサポート
      `,
      url: 'https://support.zoom.us/hc/en-us/articles/zoom-rooms-updates',
      publishedAt: new Date('2024-03-12'),
    },
    {
      id: generateId('web'),
      source: 'web',
      title: 'Zoom Phone 新機能: AI音声文字起こし',
      content: `
        Zoom Phoneに待望のAI音声文字起こし機能が追加されました。
        通話内容をリアルタイムでテキスト化し、後から検索可能になります。

        利用可能な機能:
        - リアルタイム文字起こし
        - 通話後の自動要約生成
        - キーワード検索
        - 多言語サポート（日本語対応）
      `,
      url: 'https://support.zoom.us/hc/en-us/articles/zoom-phone-transcription',
      publishedAt: new Date('2024-03-08'),
    },
  ];

  return mockData;
}
