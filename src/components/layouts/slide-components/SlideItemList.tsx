import { ResolvedColors } from "../themes/theme.types";

interface ListItem {
  title?: string;
  author_name?: string;
  description?: string;
  content?: string;
}

interface SlideItemListProps {
  items: ListItem[];
  colors: ResolvedColors;
  numbered?: boolean;
  borderStyle?: "bottom" | "none";
}

export function SlideItemList({
  items,
  colors,
  numbered = true,
  borderStyle = "bottom",
}: SlideItemListProps) {
  if (!items?.length) return null;

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-start gap-4 py-3"
          style={{
            borderBottom:
              borderStyle === "bottom" && i < items.length - 1
                ? "1px solid #f3f4f6"
                : "none",
          }}
        >
          {numbered && (
            <span
              className="slide-metric shrink-0"
              style={{ fontSize: "20px", color: colors.accent }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          )}
          <div>
            <h4
              className="font-semibold"
              style={{ fontSize: "14px", color: colors.primary }}
            >
              {item.title || item.author_name}
            </h4>
            {(item.description || item.content) && (
              <p
                className="mt-1 leading-relaxed"
                style={{ fontSize: "12px", color: colors.textLight }}
              >
                {item.description || item.content}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
