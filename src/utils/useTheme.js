import { useEffect, useState } from "react";

export default function useTheme() {
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-bs-theme') || 'light');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
      setTheme(newTheme);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });

    return () => observer.disconnect();
  }, []);

  return theme
}