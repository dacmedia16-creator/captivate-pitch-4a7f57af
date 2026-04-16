interface SlideImageGridProps {
  images: string[];
  gap?: string;
}

export function SlideImageGrid({ images, gap = "2px" }: SlideImageGridProps) {
  if (!images?.length) return null;

  return (
    <div className="flex" style={{ gap }}>
      <img
        src={images[0]}
        alt=""
        className="object-cover"
        style={{ flex: 2, height: 520, minWidth: 0 }}
      />
      {images.length > 1 && (
        <div className="flex flex-col" style={{ flex: 1, gap }}>
          {images.slice(1, 3).map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              className="w-full object-cover"
              style={{ flex: 1, minHeight: 0 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
