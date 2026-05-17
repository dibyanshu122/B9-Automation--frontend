import type { Metadata } from 'next';

export const generateMetadata = (
  title: string,
  description: string,
  path: string = '/'
): Metadata => {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brainai.in';
  const imageUrl = `${siteUrl}/og-image.png`;

  return {
    title: `${title} | B9 Automation`,
    description,
    keywords: [
      'AI',
      'chatbot',
      'knowledge management',
      'documents',
      'assistant',
    ],
    authors: [{ name: 'B9 Automation Team' }],
    creator: 'B9 Automation',
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `${siteUrl}${path}`,
    },
    openGraph: {
      title: `${title} | B9 Automation`,
      description,
      url: `${siteUrl}${path}`,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | B9 Automation`,
      description,
      images: [imageUrl],
    },
  };
};

export const generateJsonLd = (
  type: string,
  data: Record<string, any>
): string => {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  });
};