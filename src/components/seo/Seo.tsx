import { Helmet } from "react-helmet-async";

type SeoProps = {
  title: string;
  description?: string;
  /** Defaults to current path */
  canonicalPath?: string;
  image?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
};

export default function Seo({
  title,
  description,
  canonicalPath,
  image,
  ogType = "website",
  noIndex,
}: SeoProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  
  // Ensure path always ends with trailing slash for canonical URLs
  const ensureTrailingSlash = (p: string) => (p.endsWith("/") ? p : `${p}/`);
  const normalizedPath = ensureTrailingSlash(canonicalPath ?? path);
  const canonical = origin ? `${origin}${normalizedPath}` : undefined;

  return (
    <Helmet>
      <title>{title}</title>
      {description ? <meta name="description" content={description} /> : null}
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}

      <meta property="og:title" content={title} />
      {description ? <meta property="og:description" content={description} /> : null}
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta property="og:type" content={ogType} />
      {image ? <meta property="og:image" content={image} /> : null}

      <meta name="twitter:card" content="summary_large_image" />
      {image ? <meta name="twitter:image" content={image} /> : null}
    </Helmet>
  );
}
