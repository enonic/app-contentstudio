import { type ApplicationKey } from '../application/applicationKey';

export type ContentTypeName = `${string}:${string}`;

export const CONTENT_TYPE = {
    UNSTRUCTURED: 'base:unstructured',
    FOLDER: 'base:folder',
    SHORTCUT: 'base:shortcut',
    MEDIA: 'base:media',
    MEDIA_TEXT: 'media:text',
    MEDIA_DATA: 'media:data',
    MEDIA_AUDIO: 'media:audio',
    MEDIA_VIDEO: 'media:video',
    MEDIA_IMAGE: 'media:image',
    MEDIA_VECTOR: 'media:vector',
    MEDIA_ARCHIVE: 'media:archive',
    MEDIA_DOCUMENT: 'media:document',
    MEDIA_SPREADSHEET: 'media:spreadsheet',
    MEDIA_PRESENTATION: 'media:presentation',
    MEDIA_CODE: 'media:code',
    MEDIA_EXECUTABLE: 'media:executable',
    MEDIA_UNKNOWN: 'media:unknown',
    SITE: 'portal:site',
    PAGE_TEMPLATE: 'portal:page-template',
    TEMPLATE_FOLDER: 'portal:template-folder',
    FRAGMENT: 'portal:fragment',
} as const satisfies Record<string, ContentTypeName>;

const MEDIA_TYPES: readonly ContentTypeName[] = [
    CONTENT_TYPE.MEDIA_ARCHIVE,
    CONTENT_TYPE.MEDIA_AUDIO,
    CONTENT_TYPE.MEDIA_VIDEO,
    CONTENT_TYPE.MEDIA_CODE,
    CONTENT_TYPE.MEDIA_DATA,
    CONTENT_TYPE.MEDIA_DOCUMENT,
    CONTENT_TYPE.MEDIA_EXECUTABLE,
    CONTENT_TYPE.MEDIA_IMAGE,
    CONTENT_TYPE.MEDIA_SPREADSHEET,
    CONTENT_TYPE.MEDIA_PRESENTATION,
    CONTENT_TYPE.MEDIA_VECTOR,
    CONTENT_TYPE.MEDIA_TEXT,
    CONTENT_TYPE.MEDIA_UNKNOWN,
];

export function toContentTypeName(value: string): ContentTypeName {
    const [applicationKey, localName] = value.split(':');
    return `${applicationKey}:${localName}`;
}

export function applicationKeyOf(name: ContentTypeName): ApplicationKey {
    return name.split(':')[0];
}

export const isDescendantOfMedia = (name: string): boolean => MEDIA_TYPES.includes(name as ContentTypeName);
