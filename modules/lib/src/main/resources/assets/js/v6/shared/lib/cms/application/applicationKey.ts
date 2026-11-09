export type ApplicationKey = string;

export const APPLICATION_KEY = {
    SYSTEM: 'system',
    BASE: 'base',
    PORTAL: 'portal',
    MEDIA: 'media',
} as const satisfies Record<string, ApplicationKey>;
