import type { Product } from "@/lib/db/schema";
import { NailSetPreview, parseColors } from "./nail-set-preview";

export function ProductMedia({
  product,
  className = "h-44",
}: {
  product: Pick<Product, "name" | "imageUrl" | "colors" | "shape">;
  className?: string;
}) {
  if (product.imageUrl) {
    return (
      <div className={`overflow-hidden bg-blush/30 ${className}`}>
        {/* Uploaded shop photos are served from /uploads */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return <NailSetPreview colors={parseColors(product.colors)} shape={product.shape} />;
}
