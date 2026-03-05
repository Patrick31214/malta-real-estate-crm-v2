import { useState, useCallback } from 'react';

const useFavorites = (storageKey) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = useCallback((id) => {
    setFavorites(prev => {
      const next = prev.includes(id)
        ? prev.filter(f => f !== id)
        : [...prev, id];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [storageKey]);

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
};

export default useFavorites;
