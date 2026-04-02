'use client';

import { Category } from '@/lib/types';

interface CategoryTabsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  counts: Record<string, number>;
}

const categories: { key: Category | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: '📋' },
  { key: 'meeting', label: 'Meeting', icon: '📹' },
  { key: 'chat', label: 'Chat', icon: '💬' },
  { key: 'security', label: 'Security', icon: '🔒' },
  { key: 'integration', label: 'Integration', icon: '🔗' },
  { key: 'productivity', label: 'Productivity', icon: '⚡' },
  { key: 'other', label: 'Other', icon: '📌' },
];

export function CategoryTabs({
  selectedCategory,
  onSelectCategory,
  counts,
}: CategoryTabsProps) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ marginBottom: '24px' }}>
      <p style={{ fontSize: '11px', color: '#71717a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Filter by Category
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {categories.map(({ key, label, icon }) => {
          const isSelected = selectedCategory === key;
          const count = key === 'all' ? totalCount : counts[key] || 0;

          return (
            <button
              key={key}
              onClick={() => onSelectCategory(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: isSelected
                  ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                  : '#27272a',
                color: isSelected ? '#fff' : '#a1a1aa',
              }}
            >
              <span style={{ fontSize: '14px' }}>{icon}</span>
              <span>{label}</span>
              <span style={{
                backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#3f3f46',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
