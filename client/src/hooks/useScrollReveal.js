import { useEffect, useRef, useState } from 'react';

const useScrollReveal = (options = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px', ...options }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  // `options` is an object literal passed inline — using a stable ref would prevent
  // re-running on every render, but callers that genuinely change options will
  // work correctly with the shallow-equality lint rule disabled here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options)]);

  return [ref, isVisible];
};

export default useScrollReveal;
