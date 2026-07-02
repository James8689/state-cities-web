import { useEffect, useRef, useState } from "react";

export function useContainerSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 400, height: 600 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => {
      const { width, height } = node.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setSize({ width: Math.round(width), height: Math.round(height) });
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, ...size };
}
