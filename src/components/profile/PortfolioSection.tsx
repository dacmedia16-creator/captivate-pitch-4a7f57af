import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Camera, Plus, Trash2 } from "lucide-react";

interface PortfolioImage {
  image_url: string;
  caption?: string;
}

interface PortfolioSectionProps {
  images: PortfolioImage[];
  onChange: (images: PortfolioImage[]) => void;
}

export function PortfolioSection({ images, onChange }: PortfolioSectionProps) {
  const addImage = (url: string) => {
    if (images.length >= 6) return;
    onChange([...images, { image_url: url, caption: "" }]);
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    onChange(images.map((img, i) => (i === index ? { ...img, caption } : img)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-primary" /> Portfólio de Imóveis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Adicione até 6 fotos de imóveis que você vendeu ou captou. Elas aparecerão no slide de resultados.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img src={img.image_url} alt="" className="w-full h-32 rounded-lg object-cover border border-border" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
              <Input
                value={img.caption || ""}
                onChange={(e) => updateCaption(i, e.target.value)}
                placeholder="Legenda (opcional)"
                className="mt-1 text-xs h-7"
              />
            </div>
          ))}
          {images.length < 6 && (
            <ImageUploader
              value={null}
              onChange={(url) => url && addImage(url)}
              folder="portfolio"
              className="flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
