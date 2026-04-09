import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import type {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import type {ContentId} from '../../../../app/content/ContentId';

export type PageEditorLifecycle = {
    isPageLocked: boolean;
    isPageRenderable: boolean | undefined;
    isPageReady: boolean;
};

export type PageEditorContentContext = {
    contentId: ContentId;
    contentTypeName: ContentTypeName;
    siteId: ContentId | null;
    sitePath: string | null;
    isPageTemplate: boolean;
    isInherited: boolean;
    isDataInherited: boolean;
    applicationKey: ApplicationKey | null;
};

export type InitPageEditorBridgeOptions = {
    hasDefaultPageTemplate?: boolean;
    defaultPageTemplateName?: string | null;
    contentContext?: PageEditorContentContext;
};
