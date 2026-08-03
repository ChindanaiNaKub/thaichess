import { useEffect, useState } from 'react';

/** True when viewport is Tailwind `lg` and up (1024px). */
export function useLgUp(): boolean {
  const [lgUp, setLgUp] = useState(() => (
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 1024px)').matches
      : false
  ));

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setLgUp(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return lgUp;
}
