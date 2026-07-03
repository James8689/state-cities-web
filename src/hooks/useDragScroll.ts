import { useRef, useEffect, type RefObject } from "react";

const DRAG_THRESHOLD = 5;

/**
 * Enables click-and-drag horizontal scrolling on a container.
 * Suppresses child click events when an actual drag occurs.
 */
export function useDragScroll<T extends HTMLElement = HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let hasDragged = false;
    let startX = 0;
    let scrollLeft = 0;

    function onMouseDown(e: MouseEvent) {
      if (e.button !== 0) return;
      isDown = true;
      hasDragged = false;
      startX = e.pageX;
      scrollLeft = el!.scrollLeft;
      el!.style.cursor = "grabbing";
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDown) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > DRAG_THRESHOLD) {
        hasDragged = true;
        e.preventDefault();
        el!.scrollLeft = scrollLeft - dx;
      }
    }

    function onMouseUp() {
      if (!isDown) return;
      isDown = false;
      el!.style.cursor = "grab";
    }

    function onClickCapture(e: MouseEvent) {
      if (hasDragged) {
        e.stopPropagation();
        e.preventDefault();
        hasDragged = false;
      }
    }

    function onMouseLeave() {
      if (!isDown) return;
      isDown = false;
      el!.style.cursor = "grab";
    }

    el.style.cursor = "grab";
    el.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  return ref;
}
