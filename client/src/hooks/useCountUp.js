import { useState, useEffect } from 'react';

const useCountUp = (target, duration = 2000, start = false) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start || target <= 0) return;

    let startTime = null;
    let animId;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, duration, start]);

  return value;
};

export default useCountUp;
