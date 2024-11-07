import {PropertyArrayJson} from '@enonic/lib-admin-ui/data/PropertyArrayJson';
import {FormJson} from '@enonic/lib-admin-ui/form/json/FormJson';

export interface AiData {
    data?: ContentData;
    schema?: ContentSchema;
    language?: ContentLanguage;
}

export interface ContentData {
    contentId: string;
    fields: PropertyArrayJson[];
    topic: string;
    project: string;
}

export interface ContentSchema {
    form: FormJson;
    name: string;
}

export interface ContentLanguage {
    tag: string;
    name: string;
}
