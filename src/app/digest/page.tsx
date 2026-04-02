'use client';

import { useState, useEffect } from 'react';
import { SlackDigestSummary } from '@/lib/types';
import Link from 'next/link';

const priorityColors = {
  high: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#f87171' },
  medium: { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.3)', text: '#facc15' },
  low: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', text: '#4ade80' },
};

const priorityLabel = { high: '重要', medium: '推奨', low: '参考' };

export default function DigestPage() {
  const [summary, setSummary] = useState<SlackDigestSummary | null>(null);
  const [textPreview, setTextPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'text' | 'slack'>('visual');

  useEffect(() => {
    fetchDigest();
  }, []);

  const fetchDigest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/digest');
      const data = await response.json();
      if (data.success) {
        setSummary(data.data.summary);
        setTextPreview(data.data.textPreview);
      } else {
        setError(data.error || 'ダイジェストの取得に失敗しました');
      }
    } catch (err) {
      setError('ダイジェストの取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToSlack = async () => {
    try {
      setIsSending(true);
      setError(null);
      setSuccess(null);
      const response = await fetch('/api/digest', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setSuccess('Slackに投稿しました！');
      } else {
        setError(data.error || 'Slackへの投稿に失敗しました');
      }
    } catch (err) {
      setError('Slackへの投稿中にエラーが発生しました');
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(textPreview);
      setSuccess('クリップボードにコピーしました！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('コピーに失敗しました');
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f0f13', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#71717a', fontSize: '16px' }}>ダイジェストを生成中...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f0f13', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <p style={{ color: '#f87171', fontSize: '16px' }}>{error || '記事がありません'}</p>
        <Link href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>← ダッシュボードに戻る</Link>
      </div>
    );
  }

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
            <Link href="/" style={{ color: '#71717a', textDecoration: 'none', fontSize: '14px' }}>← 戻る</Link>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #10b981, #3b82f6)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              📬
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#fff' }}>Slack配信まとめ</h1>
              <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>{summary.period}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={copyToClipboard}
              style={{
                background: '#27272a',
                color: '#fff',
                border: '1px solid #3f3f46',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📋 コピー
            </button>
            <button
              onClick={handleSendToSlack}
              disabled={isSending}
              style={{
                background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSending ? 'not-allowed' : 'pointer',
                opacity: isSending ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isSending ? '送信中...' : '📤 Slackに送信'}
            </button>
          </div>
        </div>
      </header>

      {/* Alerts */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px 0' }}>
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#f87171',
            fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#4ade80',
            fontSize: '14px'
          }}>
            ✅ {success}
          </div>
        )}
      </div>

      {/* View Mode Tabs */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[
            { id: 'visual', label: '📊 ビジュアル' },
            { id: 'text', label: '📝 テキスト' },
            { id: 'slack', label: '💬 Slackプレビュー' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as 'visual' | 'text' | 'slack')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: viewMode === tab.id ? '#3b82f6' : '#27272a',
                color: viewMode === tab.id ? '#fff' : '#a1a1aa',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 60px' }}>
        {viewMode === 'visual' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>{summary.totalArticles}</p>
                <p style={{ fontSize: '14px', color: '#71717a', margin: '8px 0 0' }}>収集記事数</p>
              </div>
              <div style={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>{summary.newArticles}</p>
                <p style={{ fontSize: '14px', color: '#71717a', margin: '8px 0 0' }}>新規記事</p>
              </div>
              <div style={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#8b5cf6', margin: 0 }}>{summary.categoryBreakdown.length}</p>
                <p style={{ fontSize: '14px', color: '#71717a', margin: '8px 0 0' }}>カテゴリ</p>
              </div>
            </div>

            {/* Insights */}
            {summary.comparison.insights && (
              <div style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6', margin: '0 0 12px' }}>💡 今週のインサイト</h3>
                <p style={{ fontSize: '14px', color: '#e4e4e7', margin: 0, lineHeight: '1.6' }}>{summary.comparison.insights}</p>
              </div>
            )}

            {/* Top Highlights */}
            <div style={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: '0 0 20px' }}>✨ 今週の注目トピック</h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                {summary.topHighlights.map((highlight, index) => (
                  <div key={index} style={{
                    backgroundColor: '#27272a',
                    borderRadius: '10px',
                    padding: '16px'
                  }}>
                    <a href={highlight.url} target="_blank" rel="noopener noreferrer" style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#3b82f6',
                      textDecoration: 'none',
                      display: 'block',
                      marginBottom: '8px'
                    }}>
                      {highlight.title}
                    </a>
                    <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 12px', lineHeight: '1.5' }}>{highlight.summary}</p>
                    <p style={{
                      fontSize: '13px',
                      color: '#10b981',
                      margin: 0,
                      padding: '8px 12px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '6px',
                      display: 'inline-block'
                    }}>
                      💼 {highlight.useCase}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Actions */}
            <div style={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: '0 0 20px' }}>🎯 今週のおすすめアクション</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {summary.recommendedActions.map((action, index) => (
                  <div key={index} style={{
                    backgroundColor: priorityColors[action.priority].bg,
                    border: `1px solid ${priorityColors[action.priority].border}`,
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'flex-start'
                  }}>
                    <span style={{
                      backgroundColor: priorityColors[action.priority].border,
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}>
                      {priorityLabel[action.priority]}
                    </span>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: '#fff', margin: '0 0 4px' }}>{action.action}</p>
                      <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0 }}>{action.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown */}
            <div style={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: '0 0 20px' }}>📂 カテゴリ別サマリー</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {summary.categoryBreakdown.map((cat, index) => (
                  <div key={index} style={{
                    backgroundColor: '#27272a',
                    borderRadius: '10px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>{cat.label}</span>
                      <span style={{
                        backgroundColor: '#3f3f46',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        color: '#a1a1aa'
                      }}>{cat.count}件</span>
                    </div>
                    {cat.keyPoints.length > 0 && (
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {cat.keyPoints.slice(0, 2).map((point, i) => (
                          <li key={i} style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '4px' }}>{point}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Use Case Tips */}
            {summary.useCaseTips.length > 0 && (
              <div style={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: '0 0 20px' }}>👥 役割別おすすめTips</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {summary.useCaseTips.map((useCase, index) => (
                    <div key={index} style={{
                      backgroundColor: '#27272a',
                      borderRadius: '10px',
                      padding: '16px'
                    }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#8b5cf6',
                        margin: '0 0 12px'
                      }}>
                        {useCase.persona}
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {useCase.tips.map((tip, i) => (
                          <li key={i} style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Keywords */}
            {summary.comparison.trendingKeywords.length > 0 && (
              <div style={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontSize: '14px', color: '#71717a' }}>🏷️ トレンド:</span>
                {summary.comparison.trendingKeywords.map((keyword, index) => (
                  <span key={index} style={{
                    backgroundColor: '#3f3f46',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '13px',
                    color: '#e4e4e7'
                  }}>
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'text' && (
          <div style={{
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <pre style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#e4e4e7',
              whiteSpace: 'pre-wrap',
              margin: 0,
              lineHeight: '1.6'
            }}>
              {textPreview}
            </pre>
          </div>
        )}

        {viewMode === 'slack' && (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '700px'
          }}>
            <div style={{ fontFamily: 'Slack-Lato, Slack-Fractions, appleLogo, sans-serif' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1d1c1d', margin: '0 0 16px' }}>
                {summary.title}
              </h2>
              <p style={{ fontSize: '15px', color: '#1d1c1d', margin: '0 0 12px' }}>
                <strong>📅 {summary.period}</strong>
              </p>
              <p style={{ fontSize: '15px', color: '#1d1c1d', margin: '0 0 20px' }}>
                📊 <strong>{summary.totalArticles}件</strong> の情報を収集（新規: {summary.newArticles}件）
              </p>

              {summary.comparison.insights && (
                <>
                  <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '16px 0' }} />
                  <p style={{ fontSize: '15px', color: '#1d1c1d' }}>
                    <strong>💡 今週のインサイト</strong><br />
                    {summary.comparison.insights}
                  </p>
                </>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '16px 0' }} />
              <p style={{ fontSize: '15px', color: '#1d1c1d', fontWeight: 'bold' }}>✨ 今週の注目トピック</p>
              {summary.topHighlights.map((h, i) => (
                <div key={i} style={{ margin: '12px 0' }}>
                  <a href={h.url} style={{ color: '#1264a3', fontSize: '15px', fontWeight: 'bold' }}>{h.title}</a>
                  <p style={{ fontSize: '14px', color: '#616061', margin: '4px 0' }}>{h.summary}</p>
                  <p style={{ fontSize: '13px', color: '#616061', fontStyle: 'italic' }}>💼 {h.useCase}</p>
                </div>
              ))}

              <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '16px 0' }} />
              <p style={{ fontSize: '12px', color: '#616061' }}>
                🤖 自動生成 by Zoom Tips Collector
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
