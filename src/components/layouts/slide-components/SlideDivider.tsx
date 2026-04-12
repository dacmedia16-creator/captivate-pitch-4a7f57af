import { SlideTheme, ResolvedColors } from "../themes/theme.types";

interface SlideDividerProps {
  theme: SlideTheme;
  colors: ResolvedColors;
}

export function SlideDivider({ theme, colors }: SlideDividerProps) {
  const { divider } = theme;

  if (divider.style === "full-width") {
    return (
      <div
        style={{
          height: divider.height,
          width: "100%",
          backgroundColor: colors.accent + "18",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: divider.width,
        height: divider.height,
        backgroundColor: colors.accent,
        borderRadius: "2px",
      }}
    />
  );
}
