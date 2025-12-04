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

export async function getPageById(
  id: string,
  draft: boolean = false,
  event?: any
): Promise<Page | null> {
  try {
    const PAYLOAD_URL = getPayloadURL();
    const draftParam = draft ? "&draft=true" : "";

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Forward authentication cookies for draft requests
    if (draft) {
      if (event) {
        // Server-side: get cookies from the request event
        const cookieHeader =
          event.node.req.headers.cookie || event.headers.get("cookie");
        if (cookieHeader) {
          headers["Cookie"] = cookieHeader;
        }
      } else if (typeof window !== "undefined") {
        // Client-side: get cookies from document
        const cookies = document.cookie || "";
        headers["Cookie"] = cookies;
      }
    }

    const response = await fetch(
      `${PAYLOAD_URL}/api/pages/${id}?depth=2${draftParam}`,
      {
        headers,
      }
    );

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
  const PAYLOAD_URL = getPayloadURL();
  console.log("Fetching homepage from:", PAYLOAD_URL);

  try {
    const settingsResponse = await fetch(
      `${PAYLOAD_URL}/api/globals/site-settings?depth=2`
    );

    console.log("Site settings response status:", settingsResponse.status);

    if (!settingsResponse.ok) {
      const errorText = await settingsResponse.text();
      console.error("Failed to fetch site settings:", {
        status: settingsResponse.status,
        statusText: settingsResponse.statusText,
        body: errorText
      });
      throw new Error(
        `Failed to fetch site settings: ${settingsResponse.status} ${settingsResponse.statusText}`
      );
    }

    const settings: SiteSettings = await settingsResponse.json();
    console.log("Site settings fetched successfully:", {
      hasHomepage: !!settings.general?.homepage,
      homepageType: typeof settings.general?.homepage
    });

    const homepage = settings.general?.homepage;

    // If homepage is not set in settings, fall back to finding a page with isHomepage flag
    if (!homepage) {
      console.warn("No homepage set in site settings, falling back to isHomepage flag");
      const pagesResponse = await fetch(
        `${PAYLOAD_URL}/api/pages?where[isHomepage][equals]=true&depth=2&limit=1`
      );

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        if (pagesData.docs && pagesData.docs.length > 0) {
          console.log("Found homepage via isHomepage flag");
          return pagesData.docs[0];
        }
      }

      console.error("No homepage found in site settings or via isHomepage flag");
      return null;
    }

    if (typeof homepage !== "string") {
      console.log("Homepage found (populated)");
      return homepage;
    }

    // If homepage is just an ID string, fetch it
    console.log("Homepage is an ID, fetching full page data:", homepage);
    const pageResponse = await fetch(
      `${PAYLOAD_URL}/api/pages/${homepage}?depth=2`
    );

    if (pageResponse.ok) {
      const pageData = await pageResponse.json();
      return pageData;
    }

    console.error("Failed to fetch homepage by ID");
    return null;
  } catch (error) {
    console.error("Error fetching homepage:", error);
    // During build, log more details
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.error("Full error details:", error);
    }
    return null;
  }
}
