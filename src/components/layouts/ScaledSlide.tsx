import { useRef, useEffect, useState, ReactNode } from "react";

const SLIDE_W = 1920;
const SLIDE_H = 1080;

interface ScaledSlideProps {
  children: ReactNode;
  className?: string;
}

export function ScaledSlide({ children, className }: ScaledSlideProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const sx = width / SLIDE_W;
        const sy = height / SLIDE_H;
        setScale(Math.min(sx, sy));
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        aspectRatio: `${SLIDE_W} / ${SLIDE_H}`,
        width: "100%",
      }}
    >
      <div
        className="slide-content"
        style={{
          position: "absolute",
          width: SLIDE_W,
          height: SLIDE_H,
          left: "50%",
          top: "50%",
          marginLeft: -(SLIDE_W / 2),
          marginTop: -(SLIDE_H / 2),
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
