'use client';

import { useState, useEffect } from 'react';
import { Article, CATEGORY_LABELS } from '@/lib/types';

interface SlackSummaryModalProps {
  article: Article;
  onClose: () => void;
}

interface SlackSummary {
  title: string;
  category: string;
  summary: string;
  keyPoints: string[];
  useCase: string;
  actionItem: string;
  url: string;
  slackText: string;
}

export function SlackSummaryModal({ article, onClose }: SlackSummaryModalProps) {
  const [summary, setSummary] = useState<SlackSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateSummary();
  }, [article]);

  const generateSummary = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/slack-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article }),
      });
      const data = await response.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary.slackText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const categoryLabel = CATEGORY_LABELS[article.category];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#18181b',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid #27272a',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          backgroundColor: '#18181b',
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>💬</span>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
                Slack周知用まとめ
              </h2>
              <p style={{ fontSize: '12px', color: '#71717a', margin: '4px 0 0' }}>
                コピーしてSlackに投稿できます
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#71717a',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#71717a', fontSize: '14px' }}>要約を生成中...</p>
            </div>
          ) : summary ? (
            <>
              {/* Preview */}
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
              }}>
                <div style={{ fontFamily: 'sans-serif' }}>
                  {/* Slack message header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '4px',
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      📹
                    </div>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#1d1c1d', margin: 0 }}>
                        Zoom Tips Bot
                      </p>
                      <p style={{ fontSize: '12px', color: '#616061', margin: 0 }}>
                        今日
                      </p>
                    </div>
                  </div>

                  {/* Message content */}
                  <div style={{
                    borderLeft: '4px solid #10b981',
                    paddingLeft: '12px',
                    marginBottom: '16px',
                  }}>
                    <p style={{
                      fontSize: '15px',
                      fontWeight: 'bold',
                      color: '#1d1c1d',
                      margin: '0 0 8px',
                    }}>
                      {categoryLabel} {summary.title}
                    </p>
                  </div>

                  <p style={{ fontSize: '14px', color: '#1d1c1d', margin: '0 0 16px', lineHeight: '1.6' }}>
                    {summary.summary}
                  </p>

                  {/* Key points */}
                  <div style={{
                    backgroundColor: '#f8f8f8',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                  }}>
                    <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#1d1c1d', margin: '0 0 8px' }}>
                      📌 ポイント
                    </p>
                    {summary.keyPoints.map((point, i) => (
                      <p key={i} style={{ fontSize: '13px', color: '#1d1c1d', margin: '4px 0', paddingLeft: '8px' }}>
                        • {point}
                      </p>
                    ))}
                  </div>

                  {/* Use case */}
                  <div style={{
                    backgroundColor: '#e8f5e9',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                  }}>
                    <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#2e7d32', margin: '0 0 4px' }}>
                      💼 こんな時に使える
                    </p>
                    <p style={{ fontSize: '13px', color: '#1d1c1d', margin: 0 }}>
                      {summary.useCase}
                    </p>
                  </div>

                  {/* Action item */}
                  <div style={{
                    backgroundColor: '#fff3e0',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                  }}>
                    <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#e65100', margin: '0 0 4px' }}>
                      ✅ アクション
                    </p>
                    <p style={{ fontSize: '13px', color: '#1d1c1d', margin: 0 }}>
                      {summary.actionItem}
                    </p>
                  </div>

                  {/* Link */}
                  <p style={{ fontSize: '13px', color: '#616061', margin: 0 }}>
                    🔗 <a href={summary.url} style={{ color: '#1264a3' }}>元記事を読む</a>
                  </p>
                </div>
              </div>

              {/* Copy text area */}
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: '#71717a', marginBottom: '8px' }}>
                  コピー用テキスト:
                </p>
                <div style={{
                  backgroundColor: '#27272a',
                  borderRadius: '8px',
                  padding: '16px',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}>
                  <pre style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#e4e4e7',
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                    lineHeight: '1.5',
                  }}>
                    {summary.slackText}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={copyToClipboard}
                  style={{
                    flex: 1,
                    background: copied ? '#10b981' : 'linear-gradient(135deg, #10b981, #3b82f6)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {copied ? '✅ コピーしました！' : '📋 クリップボードにコピー'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#f87171', fontSize: '14px' }}>要約の生成に失敗しました</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
