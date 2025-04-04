export const getImageUrl = (imagePath: string): string => {
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Remove any double slashes (except for http://)
  const cleanPath = imagePath.replace(/([^:])\/\//g, '$1/');

  // Remove leading dot if present (handle ./images/file.jpg format)
  const pathWithoutDot = cleanPath.startsWith('./') ? cleanPath.substring(1) : cleanPath;

  // Prepare the base path
  let basePath = '';
  if (pathWithoutDot.startsWith('/images/')) {
    basePath = pathWithoutDot;
  } else {
    // If it doesn't start with /images, prepend it
    basePath = `/images/${pathWithoutDot.startsWith('/') ? pathWithoutDot.slice(1) : pathWithoutDot}`;
  }

  // Use the API route instead of direct file access
  // This ensures the image is served correctly in both development and production
  const apiPath = `/api/images${basePath.substring('/images'.length)}`;

  // Add cache busting query parameter
  return `${apiPath}?t=${Date.now()}`;
};
