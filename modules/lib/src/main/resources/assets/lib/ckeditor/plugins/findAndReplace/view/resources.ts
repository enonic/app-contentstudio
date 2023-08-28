export const getResourceUrl = path => CKEDITOR.getUrl(CKEDITOR.plugins.get('findAndReplace').path + path);
export const getStylesUrl = path => getResourceUrl(`styles/${path}`);
