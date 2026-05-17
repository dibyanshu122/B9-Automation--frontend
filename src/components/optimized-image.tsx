'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  fill?: boolean;
}

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  fill = false,
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoading ? 0.5 : 1 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-lg"
    >
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        onLoadingComplete={() => setIsLoading(false)}
        className={className}
        quality={75}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </motion.div>
  );
};