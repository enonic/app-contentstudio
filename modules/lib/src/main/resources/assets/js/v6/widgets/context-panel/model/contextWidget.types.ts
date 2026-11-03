import type { LucideIcon } from '@enonic/ui';

export type ContextWidget = {
    key: string;
    name: string;
    applicationKey: string;
    title: string;
    description: string;
    icon?: LucideIcon;
    iconUrl?: string;
    url?: string;
    renderOnResize?: boolean;
    requiresContent?: boolean;
};
