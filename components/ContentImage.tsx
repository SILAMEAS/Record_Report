// components/ContentImage.tsx
"use client";

import Image from "next/image";

interface ContentImageProps {
  src: string;
  alt: string;
}

export function ContentImage({ src, alt }: ContentImageProps) {
    console.log("src===",src)
  return (
    <div className="aspect-video relative">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover"
        placeholder="blur"
        blurDataURL="/placeholder.svg"
        onError={(e) => {
          console.error(`Failed to load image: ${src}`);
        }}
      />
    </div>
  );
}