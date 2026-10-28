import Head from "next/head";
import { DESCRIPTION, SITE_NAME as SITE, SITE_URL, SOCIALS } from "@/lib/site";

export default function Seo({
  title,
  description = DESCRIPTION,
  path = "/",
  person = false,
}) {
  const full = title ? `${title} · ${SITE}` : SITE;
  const url = `${SITE_URL}${path}`;
  const image = `${SITE_URL}/og.png`;
  return (
    <Head>
      <title>{full}</title>
      <meta name="description" content={description} key="description" />
      <link rel="canonical" href={url} key="canonical" />

      <meta property="og:type" content="website" key="og:type" />
      <meta property="og:site_name" content={SITE} key="og:site_name" />
      <meta property="og:locale" content="en_US" key="og:locale" />
      <meta property="og:title" content={full} key="og:title" />
      <meta
        property="og:description"
        content={description}
        key="og:description"
      />
      <meta property="og:url" content={url} key="og:url" />
      <meta property="og:image" content={image} key="og:image" />
      <meta property="og:image:width" content="1200" key="og:image:width" />
      <meta property="og:image:height" content="630" key="og:image:height" />
      <meta
        property="og:image:alt"
        content="Farrel's Portofolio: the homepage, with an ASCII cat sitting on a rooftop"
        key="og:image:alt"
      />

      <meta
        name="twitter:card"
        content="summary_large_image"
        key="twitter:card"
      />
      <meta name="twitter:title" content={full} key="twitter:title" />
      <meta
        name="twitter:description"
        content={description}
        key="twitter:description"
      />
      <meta name="twitter:image" content={image} key="twitter:image" />

      {person && (
        <script
          type="application/ld+json"
          key="person"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Farrel",
              url: SITE_URL,
              image,
              jobTitle: "IoT Developer",
              description: DESCRIPTION,
              affiliation: {
                "@type": "CollegeOrUniversity",
                name: "Adelaide University",
                url: "https://adelaide.edu.au",
              },
              sameAs: SOCIALS.map((s) => s.href),
            }),
          }}
        />
      )}
    </Head>
  );
}
