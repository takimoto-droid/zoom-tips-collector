'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Article } from '@/lib/types';
import { ArticleCard } from './ArticleCard';
import { CategoryTabs } from './CategoryTabs';

interface Stats {
  totalArticles: number;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  lastUpdated: string | null;
}

export function Dashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/articles');
      const data = await response.json();
      if (data.success) {
        setArticles(data.data.articles);
        setStats(data.data.stats);
      } else {
        setError(data.error || '記事の取得に失敗しました');
      }
    } catch (err) {
      setError('記事の取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCollect = async () => {
    try {
      setIsCollecting(true);
      setError(null);
      const response = await fetch('/api/collect', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        await fetchArticles();
      } else {
        setError(data.error || '情報収集に失敗しました');
      }
    } catch (err) {
      setError('情報収集中にエラーが発生しました');
    } finally {
      setIsCollecting(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredArticles(articles);
    } else {
      setFilteredArticles(articles.filter((a) => a.category === selectedCategory));
    }
  }, [articles, selectedCategory]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f0f13' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#18181b',
        borderBottom: '1px solid #27272a',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              📹
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#fff' }}>Zoom Tips Collector</h1>
              <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>AI-Powered Tips Aggregator</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              href="/digest"
              style={{
                background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📬 Slackまとめ
            </Link>
            <button
              onClick={handleCollect}
              disabled={isCollecting}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isCollecting ? 'not-allowed' : 'pointer',
                opacity: isCollecting ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isCollecting ? '収集中...' : '🔄 Collect Tips'}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total', value: stats.totalArticles, icon: '📊' },
              { label: 'RSS', value: stats.bySource['rss'] || 0, icon: '📰' },
              { label: 'Twitter', value: stats.bySource['twitter'] || 0, icon: '🐦' },
              { label: 'Web', value: stats.bySource['web'] || 0, icon: '🌐' },
            ].map((stat) => (
              <div key={stat.label} style={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0' }}>{stat.label}</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#fff' }}>{stat.value}</p>
                </div>
                <span style={{ fontSize: '24px' }}>{stat.icon}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#f87171',
            fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Category Tabs */}
        {stats && (
          <CategoryTabs
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            counts={stats.byCategory}
          />
        )}

        {/* Articles */}
        {isLoading ? (
          <p style={{ color: '#71717a', textAlign: 'center', padding: '40px' }}>読み込み中...</p>
        ) : filteredArticles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>記事がありません</h3>
            <p style={{ fontSize: '14px', color: '#71717a', marginBottom: '20px' }}>Collect Tipsボタンをクリックして情報を収集してください</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '12px', color: '#71717a', marginBottom: '16px' }}>
              {filteredArticles.length}件の記事
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <footer style={{ marginTop: '60px', paddingTop: '24px', borderTop: '1px solid #27272a', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#52525b' }}>
            🤖 OpenAI &nbsp;|&nbsp; 📡 Multi-Source &nbsp;|&nbsp; 💬 Slack Bot
          </p>
        </footer>
      </main>
    </div>
  );
}
