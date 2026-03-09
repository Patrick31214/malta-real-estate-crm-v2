import { useState, useEffect, useRef } from 'react';

const useTypingEffect = (texts, options = {}) => {
  const {
    typingSpeed = 60,
    deletingSpeed = 30,
    pauseDuration = 2000,
    loop = true,
  } = options;

  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef(null);

  const textArray = Array.isArray(texts) ? texts : [texts];

  useEffect(() => {
    const currentText = textArray[currentIndex];

    if (isTyping) {
      if (displayText.length < currentText.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(currentText.slice(0, displayText.length + 1));
        }, typingSpeed);
      } else {
        timeoutRef.current = setTimeout(() => {
          if (textArray.length > 1) setIsTyping(false);
        }, pauseDuration);
      }
    } else {
      if (displayText.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, deletingSpeed);
      } else {
        const nextIndex = (currentIndex + 1) % textArray.length;
        if (loop || nextIndex !== 0) {
          setCurrentIndex(nextIndex);
          setIsTyping(true);
        }
      }
    }

    return () => clearTimeout(timeoutRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayText, isTyping, currentIndex, typingSpeed, deletingSpeed, pauseDuration, loop]);

  return { displayText, isTyping };
};

export default useTypingEffect;
