/**
 * Payload CMS API client (based on Astro frontend implementation)
 */

/**
 * Get the Payload server URL from runtime config
 */
const getPayloadURL = (): string => {
  const config = useRuntimeConfig();
  return config.public.payloadUrl as string;
};

/**
 * Converts a relative Payload media URL to an absolute URL
 */
export function getMediaUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const cleanUrl = url.startsWith("/") ? url.slice(1) : url;
  return `${getPayloadURL()}/${cleanUrl}`;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  isHomepage?: boolean;
  parent?: Page | string;
  breadcrumbs?: Array<{
    doc: string | Page;
    url: string;
    label: string;
  }>;
  content?: Array<HeroBlock | RichTextBlock>;
  meta?: {
    title?: string;
    description?: string;
    image?: {
      url: string;
      alt: string;
    };
    ogType?: "website" | "article" | "product";
    twitterCard?: "summary" | "summary_large_image";
    canonicalUrl?: string;
    robots?: {
      noindex?: boolean;
      nofollow?: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  general: {
    homepage?: Page | string;
  };
}

export interface HeroBlock {
  blockType: "hero";
  id: string;
  heading: string;
  subheading?: string;
  image?: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
  cta?: {
    text: string;
    link: string;
    style: "primary" | "secondary" | "outline";
  };
}

export interface RichTextBlock {
  blockType: "richText";
  id: string;
  content: {
    root: {
      type: string;
      children: any[];
    };
  };
}

export async function getAllPages(): Promise<Page[]> {
  try {
    const PAYLOAD_URL = getPayloadURL();
    const response = await fetch(`${PAYLOAD_URL}/api/pages?depth=2&limit=100`);
    if (!response.ok) {
      throw new Error(`Failed to fetch pages: ${response.statusText}`);
    }
    const data = await response.json();
    return data.docs;
  } catch (error) {
    console.error("Error fetching pages:", error);
    return [];
  }
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const PAYLOAD_URL = getPayloadURL();
    const response = await fetch(
      `${PAYLOAD_URL}/api/pages?where[slug][equals]=${slug}&depth=2&limit=1`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.statusText}`);
    }
    const data = await response.json();
    return data.docs[0] || null;
  } catch (error) {
    console.error("Error fetching page:", error);
    return null;
  }
}

export async function getPageById(id: string): Promise<Page | null> {
  try {
    const PAYLOAD_URL = getPayloadURL();
    const response = await fetch(`${PAYLOAD_URL}/api/pages/${id}?depth=2`);
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching page by ID:", error);
    return null;
  }
}

export async function getHomepage(): Promise<Page | null> {
  try {
    const PAYLOAD_URL = getPayloadURL();
    const settingsResponse = await fetch(
      `${PAYLOAD_URL}/api/globals/site-settings?depth=2`
    );
    if (!settingsResponse.ok) {
      throw new Error(
        `Failed to fetch site settings: ${settingsResponse.statusText}`
      );
    }
    const settings: SiteSettings = await settingsResponse.json();

    const homepage = settings.general?.homepage;
    if (homepage && typeof homepage !== "string") {
      return homepage;
    }

    return null;
  } catch (error) {
    console.error("Error fetching homepage:", error);
    return null;
  }
}
