interface SlideLabelProps {
  children: React.ReactNode;
  color: string;
  bold?: boolean;
}

export function SlideLabel({ children, color, bold }: SlideLabelProps) {
  return (
    <p
      className="slide-label"
      style={{ color, fontWeight: bold ? 700 : 600 }}
    >
      {children}
    </p>
  );
}
