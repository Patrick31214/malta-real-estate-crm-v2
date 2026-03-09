import React from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';
import useCountUp from '../../hooks/useCountUp';

const AnimatedCounter = ({
  value,
  prefix = '',
  suffix = '',
  duration = 2000,
  format = 'number', // 'number' | 'currency' | 'abbreviate'
  className = '',
  style = {},
}) => {
  const [ref, isVisible] = useScrollReveal({ threshold: 0.3 });
  const count = useCountUp(value, duration, isVisible);

  const formatValue = (n) => {
    if (format === 'currency') {
      return `€${n.toLocaleString('en-EU')}`;
    }
    if (format === 'abbreviate') {
      if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
      if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
      return n.toLocaleString();
    }
    return n.toLocaleString();
  };

  return (
    <span
      ref={ref}
      className={`counter-number ${className}`}
      style={style}
    >
      {prefix}{formatValue(count)}{suffix}
    </span>
  );
};

export default AnimatedCounter;
