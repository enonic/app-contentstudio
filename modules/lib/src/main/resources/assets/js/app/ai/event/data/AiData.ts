import {type PropertyArrayJson} from '@enonic/lib-admin-ui/data/PropertyArrayJson';
import {type FormJson} from '@enonic/lib-admin-ui/form/json/FormJson';

export interface AiData {
    data?: ContentData;
    schema?: ContentSchema;
    language?: ContentLanguage;
}

export interface ContentData {
    contentId: string;
    contentPath: string;
    fields: PropertyArrayJson[];
    topic: string;
    project: string;
    mixins?: MixinContentData[];
    page?: PageContentData;
}

export interface MixinContentData {
    name: string;
    fields: PropertyArrayJson[];
}

export interface PageContentData {
    controller?: string;
    config?: PropertyArrayJson[];
    components?: PageComponentData[];
}

export interface PageComponentData {
    path: string;
    text?: string;
    descriptor?: string;
    config?: PropertyArrayJson[];
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
