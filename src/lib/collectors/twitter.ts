import { RawContent, DEFAULT_CONFIG } from '../types';
import { generateId } from '../utils';

// X (Twitter) API v2 の型定義
interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
  };
}

interface TwitterUser {
  id: string;
  name: string;
  username: string;
}

interface TwitterSearchResponse {
  data?: Tweet[];
  includes?: {
    users?: TwitterUser[];
  };
  meta?: {
    result_count: number;
    next_token?: string;
  };
}

/**
 * X API v2 で検索を実行
 * 注意: 実際に使用する場合はTwitter Developer Accountが必要
 */
export async function searchTweets(
  query: string,
  maxResults: number = 10
): Promise<RawContent[]> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;

  if (!bearerToken) {
    console.warn('TWITTER_BEARER_TOKEN が設定されていません。モックデータを返します。');
    return getMockTwitterData();
  }

  try {
    const url = new URL('https://api.twitter.com/2/tweets/search/recent');
    url.searchParams.append('query', query);
    url.searchParams.append('max_results', String(Math.min(maxResults, 100)));
    url.searchParams.append('tweet.fields', 'created_at,public_metrics,author_id');
    url.searchParams.append('expansions', 'author_id');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data: TwitterSearchResponse = await response.json();

    if (!data.data) {
      return [];
    }

    // ユーザー情報をマップに変換
    const userMap = new Map<string, TwitterUser>();
    if (data.includes?.users) {
      for (const user of data.includes.users) {
        userMap.set(user.id, user);
      }
    }

    return data.data.map((tweet) => {
      const user = userMap.get(tweet.author_id);
      return {
        id: generateId('twitter'),
        source: 'twitter' as const,
        title: tweet.text.substring(0, 100) + (tweet.text.length > 100 ? '...' : ''),
        content: tweet.text,
        url: `https://twitter.com/${user?.username || 'user'}/status/${tweet.id}`,
        publishedAt: new Date(tweet.created_at),
        author: user?.name || 'Unknown',
        tags: extractHashtags(tweet.text),
      };
    });
  } catch (error) {
    console.error('Twitter検索エラー:', error);
    return getMockTwitterData();
  }
}

/**
 * 複数のクエリで検索を実行
 */
export async function searchMultipleQueries(
  queries: string[] = DEFAULT_CONFIG.twitter.queries,
  maxTweetsPerQuery: number = 10
): Promise<RawContent[]> {
  const results: RawContent[] = [];

  for (const query of queries) {
    const tweets = await searchTweets(query, maxTweetsPerQuery);
    results.push(...tweets);
    // レート制限対策
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // 重複除去（URLベース）
  const seen = new Set<string>();
  return results.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

/**
 * テキストからハッシュタグを抽出
 */
function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g);
  return matches || [];
}

/**
 * モック用のTwitterデータを生成
 */
export function getMockTwitterData(): RawContent[] {
  const mockTweets: RawContent[] = [
    {
      id: generateId('twitter'),
      source: 'twitter',
      title: 'Zoomで知らなかった便利機能！ミーティング中に「Alt+Y」で手を挙げられる...',
      content:
        'Zoomで知らなかった便利機能！ミーティング中に「Alt+Y」で手を挙げられるって知ってました？大人数の会議で発言したい時に便利です。#ZoomTips #リモートワーク',
      url: 'https://twitter.com/tech_tips_jp/status/1234567890',
      publishedAt: new Date('2024-03-17T10:30:00Z'),
      author: 'テックTips',
      tags: ['#ZoomTips', '#リモートワーク'],
    },
    {
      id: generateId('twitter'),
      source: 'twitter',
      title: '今日発見したZoomの新機能。ミーティング後に自動で要約が生成される...',
      content:
        '今日発見したZoomの新機能。ミーティング後に自動で要約が生成されるようになってた！これでメモ取りながら会議に集中しなくても良くなった。AI時代すごい。 #Zoom #AI #生産性向上',
      url: 'https://twitter.com/remote_worker_123/status/1234567891',
      publishedAt: new Date('2024-03-16T14:20:00Z'),
      author: 'リモートワーカー',
      tags: ['#Zoom', '#AI', '#生産性向上'],
    },
    {
      id: generateId('twitter'),
      source: 'twitter',
      title: 'Zoomのバーチャル背景、最近は動画も設定できるようになってるんですね...',
      content:
        'Zoomのバーチャル背景、最近は動画も設定できるようになってるんですね。自分の部屋が散らかってても安心w #Zoom #在宅勤務 #バーチャル背景',
      url: 'https://twitter.com/wfh_life/status/1234567892',
      publishedAt: new Date('2024-03-15T09:45:00Z'),
      author: '在宅ワーカー',
      tags: ['#Zoom', '#在宅勤務', '#バーチャル背景'],
    },
    {
      id: generateId('twitter'),
      source: 'twitter',
      title: 'Zoom×Slack連携を設定してみた。Slackから直接ミーティング開始できるの便利すぎ...',
      content:
        'Zoom×Slack連携を設定してみた。Slackから直接ミーティング開始できるの便利すぎる。/zoomコマンドだけでOK。もっと早く知りたかった... #Zoom #Slack #業務効率化',
      url: 'https://twitter.com/productivity_hack/status/1234567893',
      publishedAt: new Date('2024-03-14T16:10:00Z'),
      author: '業務効率化マニア',
      tags: ['#Zoom', '#Slack', '#業務効率化'],
    },
    {
      id: generateId('twitter'),
      source: 'twitter',
      title: 'Zoomのブレイクアウトルーム、事前に参加者を割り当てておけるの知ってました？...',
      content:
        'Zoomのブレイクアウトルーム、事前に参加者を割り当てておけるの知ってました？ワークショップ運営がめっちゃ楽になる。CSVでインポートもできます。 #Zoom #オンラインセミナー #Tips',
      url: 'https://twitter.com/online_event_pro/status/1234567894',
      publishedAt: new Date('2024-03-13T11:25:00Z'),
      author: 'オンラインイベント運営',
      tags: ['#Zoom', '#オンラインセミナー', '#Tips'],
    },
    {
      id: generateId('twitter'),
      source: 'twitter',
      title: 'Zoomの録画、クラウドに保存すると自動で文字起こしされるの神機能...',
      content:
        'Zoomの録画、クラウドに保存すると自動で文字起こしされるの神機能。議事録作成の時間が半分になった。有料プランだけど元は取れてる。 #Zoom #議事録 #時短',
      url: 'https://twitter.com/meeting_master/status/1234567895',
      publishedAt: new Date('2024-03-12T13:50:00Z'),
      author: '会議マスター',
      tags: ['#Zoom', '#議事録', '#時短'],
    },
  ];

  return mockTweets;
}
