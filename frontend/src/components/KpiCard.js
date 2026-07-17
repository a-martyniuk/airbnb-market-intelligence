import React from 'react';

export default function KpiCard({ title, value, delta, deltaType = 'positive', icon: Icon, sparklineData, tooltipText }) {
  const isPos = deltaType === 'positive';
  const deltaClass = isPos ? 'delta-pos' : 'delta-neg';
  const deltaSign = isPos && delta && !delta.toString().startsWith('+') && !delta.toString().startsWith('-') ? '+' : '';

  // Generate SVG path for sparkline
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const width = 70;
    const height = 24;
    const padding = 3;
    const maxVal = Math.max(...sparklineData);
    const minVal = Math.min(...sparklineData);
    const range = maxVal - minVal || 1;

    const points = sparklineData.map((val, idx) => {
      const x = padding + (idx / (sparklineData.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (val - minVal) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${points.join(' L ')}`;
    const color = isPos ? 'var(--accent-emerald)' : 'var(--accent-coral)';

    return (
      <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'hidden', flexShrink: 0, width: `${width}px`, height: `${height}px`, display: 'block' }}
      >
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="glass-card kpi-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '92px', gap: '10px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {Icon && <Icon size={14} style={{ color: 'var(--text-secondary)' }} />}
          <span className="kpi-title" style={{ margin: 0 }}>{title}</span>
          {tooltipText && (
            <span className="ui-tooltip-wrapper">
              <span style={{ fontSize: '0.68rem', cursor: 'help', opacity: 0.6 }}>ℹ️</span>
              <span className="ui-tooltip">{tooltipText}</span>
            </span>
          )}
        </div>
        <div className="kpi-value" style={{ fontSize: '1.65rem' }}>{value}</div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
        {renderSparkline()}
        {delta !== undefined && delta !== null && (
          <div className={`kpi-delta ${deltaClass}`} style={{ fontSize: '0.75rem', padding: '1px 6px', borderRadius: '10px' }}>
            {deltaSign}{delta}
          </div>
        )}
      </div>
    </div>
  );
}
