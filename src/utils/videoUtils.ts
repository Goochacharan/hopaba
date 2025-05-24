
export const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

export const isVimeoUrl = (url: string): boolean => {
  return url.includes('vimeo.com');
};

export const getYouTubeEmbedUrl = (url: string): string => {
  if (url.includes('watch?v=')) {
    const videoId = new URL(url).searchParams.get('v');
    return `https://www.youtube.com/embed/${videoId}`;
  } else if (url.includes('youtu.be')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
};

export const getVimeoEmbedUrl = (url: string): string => {
  const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0];
  return `https://player.vimeo.com/video/${vimeoId}`;
};

export const getEmbedUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (isYouTubeUrl(url)) return getYouTubeEmbedUrl(url);
  if (isVimeoUrl(url)) return getVimeoEmbedUrl(url);
  return null;
};
