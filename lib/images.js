// where uploaded images live (S3_PUBLIC_URL + rel.blue/). next.config lets next/image optimise these;
// a link anywhere else is shown as it is
export const IMAGE_BASE = "https://botaniq.is3.cloudhost.id/rel.blue/";

export const optimisable = (src) => src.startsWith(IMAGE_BASE);
