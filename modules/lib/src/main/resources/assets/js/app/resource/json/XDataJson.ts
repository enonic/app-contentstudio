import {SchemaJson} from 'lib-admin-ui/schema/SchemaJson';
import {FormJson} from 'lib-admin-ui/form/json/FormJson';

export interface XDataJson
    extends SchemaJson {

    form: FormJson;

    isOptional: boolean;

}
