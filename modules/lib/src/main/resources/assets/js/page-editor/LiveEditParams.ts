
export interface LiveEditParams {

    isFragment?: boolean;

    isFragmentAllowed?: boolean;

    isPageTemplate?: boolean;

    displayName?: string;

    locked?: boolean;

    isResetEnabled?: boolean;

    pageName?: string;

    pageIconClass?: string;

    isPageEmpty?: boolean;

    applicationKeys?: string[];

    contentId: string;

    language?: string;

    contentType?: string;

    sitePath?: string;

    modifyPermissions?: boolean;

    getFragmentIdByPath: (path: string) => string | undefined;

    getTextComponentData: (path: string) => string | undefined;
}
