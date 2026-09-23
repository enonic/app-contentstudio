import type { FormJson, PropertyTreeJson } from '@enonic/ui-types';

export interface ContentData {
    contentId: string;
    contentPath: string;
    fields: PropertyTreeJson;
    topic: string;
    project: string;
    mixins?: MixinContentData[];
    page?: PageContentData;
}

export interface MixinContentData {
    name: string;
    fields: PropertyTreeJson;
}

export interface PageContentData {
    controller?: string;
    config?: PropertyTreeJson;
    components?: PageComponentData[];
}

export interface PageComponentData {
    path: string;
    text?: string;
    descriptor?: string;
    config?: PropertyTreeJson;
}

export interface ContentSchema {
    form: FormJson;
    name: string;
    mixins?: MixinContentSchema[];
    page?: PageContentSchema;
}

export interface MixinContentSchema {
    name: string;
    form: FormJson;
}

export interface PageContentSchema {
    configForm?: FormJson;
    componentForms?: PageComponentSchema[];
}

export interface PageComponentSchema {
    descriptor: string;
    configForm: FormJson;
}

export interface ContentLanguage {
    tag: string;
    name: string;
}
