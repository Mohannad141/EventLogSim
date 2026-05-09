import { useEffect, useRef, useState } from 'react';
import { getItem, setItem } from '../utils/storage.js';

export const usePersistedState = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    const stored = getItem(key);
    return stored === null ? initialValue : stored;
  });

  const skipFirstWrite = useRef(true);
  useEffect(() => {
    if (skipFirstWrite.current) {
      skipFirstWrite.current = false;
      return;
    }
    setItem(key, value);
  }, [key, value]);

  return [value, setValue];
};
