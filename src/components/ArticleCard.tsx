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
  chat: '#10b981',
  security: '#f43f5e',
  integration: '#8b5cf6',
  productivity: '#f59e0b',
  other: '#6b7280',
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

  return (
    <>
      <div style={{
        backgroundColor: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}>
        {/* Color bar */}
        <div style={{ height: '3px', backgroundColor: color }} />

        <div style={{ padding: '16px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
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
