import { Image } from 'react-native';

export const preloadImages = (imageUris: string[]) => {
  // prefetch accepts string, not array
  imageUris.forEach(uri => {
    Image.prefetch(uri);
  });
};

export const optimizeImageUri = (uri: string, width: number, height: number): string => {
  if (uri.includes('cloudinary.com')) {
    return uri.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`);
  }
  return uri;
};