'use client';

import { useState } from 'react';
import { Article, CATEGORY_LABELS } from '@/lib/types';
import { getRelativeTime } from '@/lib/utils';
import { SlackSummaryModal } from './SlackSummaryModal';

interface ArticleCardProps {
  article: Article;
}

const categoryColors: Record<string, string> = {
  meeting: '#3b82f6',
  phone: '#14b8a6',
  chat: '#10b981',
  security: '#f43f5e',
  integration: '#8b5cf6',
  productivity: '#f59e0b',
  other: '#6b7280',
};

const articleTypeLabels: Record<string, { label: string; color: string }> = {
  hack: { label: '実践Tips', color: '#f59e0b' },
  new_feature: { label: '新機能', color: '#3b82f6' },
  ai: { label: 'AI連携', color: '#8b5cf6' },
  news: { label: 'ニュース', color: '#6b7280' },
};

const priorityStyles: Record<string, { border: string; glow: string }> = {
  high: { border: '1px solid rgba(245, 158, 11, 0.4)', glow: '0 0 12px rgba(245, 158, 11, 0.1)' },
  medium: { border: '1px solid #27272a', glow: 'none' },
  low: { border: '1px solid #1f1f23', glow: 'none' },
};

const sourceIcons: Record<string, string> = {
  rss: '📰',
  web: '🌐',
  twitter: '🐦',
  api: '🔌',
};

export function ArticleCard({ article }: ArticleCardProps) {
  const [showModal, setShowModal] = useState(false);
  const color = categoryColors[article.category] || categoryColors.other;
  const icon = sourceIcons[article.source] || '📄';
  const label = CATEGORY_LABELS[article.category];
  const priority = article.priority || 'medium';
  const typeInfo = articleTypeLabels[article.articleType] || articleTypeLabels.news;
  const pStyle = priorityStyles[priority] || priorityStyles.medium;

  return (
    <>
      <div style={{
        backgroundColor: '#18181b',
        border: pStyle.border,
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: pStyle.glow,
      }}>
        {/* Color bar */}
        <div style={{ height: '3px', backgroundColor: color }} />

        <div style={{ padding: '16px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{
                backgroundColor: color,
                color: '#fff',
                fontSize: '11px',
                fontWeight: '600',
                padding: '4px 10px',
                borderRadius: '6px'
              }}>
                {label}
              </span>
              <span style={{
                backgroundColor: `${typeInfo.color}20`,
                color: typeInfo.color,
                fontSize: '10px',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '4px',
                border: `1px solid ${typeInfo.color}40`,
              }}>
                {typeInfo.label}
              </span>
              {priority === 'high' && (
                <span style={{ fontSize: '12px' }} title="重要度: 高">★</span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: '#71717a' }}>
              {getRelativeTime(article.publishedAt)}
            </span>
          </div>

          {/* Title */}
          <h3 style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '8px',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {article.title}
          </h3>

          {/* Summary */}
          <p style={{
            fontSize: '12px',
            color: '#a1a1aa',
            marginBottom: '12px',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {article.summary}
          </p>

          {/* Tips */}
          <div style={{
            backgroundColor: `${color}15`,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#d4d4d8', marginBottom: '8px' }}>
              💡 Tips
            </p>
            <ul style={{ margin: 0, paddingLeft: '16px' }}>
              {article.tips.slice(0, 2).map((tip, i) => (
                <li key={i} style={{
                  fontSize: '11px',
                  color: '#a1a1aa',
                  marginBottom: '4px',
                  lineHeight: '1.4'
                }}>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '1px solid #27272a'
          }}>
            <span style={{ fontSize: '11px', color: '#71717a' }}>
              {icon} {article.source.toUpperCase()}
            </span>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#10b981',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                💬 Slack要約
              </button>
              <a
                href={article.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#60a5fa',
                  textDecoration: 'none'
                }}
              >
                Read More →
              </a>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <SlackSummaryModal
          article={article}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
