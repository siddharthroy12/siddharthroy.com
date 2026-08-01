const getPreviewUrl = (item: {
  slug: string;
  image?: string;
  noPreview?: boolean;
}): string | null => {
  if (item.noPreview) {
    return null;
  }

  if (item.image) {
    return `/images/${item.image}`;
  }

  return `/images/previews/${item.slug}.png`;
};

export default getPreviewUrl;
