import {PropertyArrayJson} from '@enonic/lib-admin-ui/data/PropertyArrayJson';
import {FormJson} from '@enonic/lib-admin-ui/form/json/FormJson';

export interface EnonicAiAssistantData {
    data: ContentData;
    schema?: {
        form: FormJson;
        name: string;
    }
}

export interface ContentData {
    fields: PropertyArrayJson[];
    topic: string;
    language: string;
}

export interface ResultData {
    fields: PropertyArrayJson[]; // can be anything, so will need to add a class to validate it and process if needed
}
