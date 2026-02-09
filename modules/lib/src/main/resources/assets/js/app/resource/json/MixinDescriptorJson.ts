import {type SchemaJson} from '@enonic/lib-admin-ui/schema/SchemaJson';
import {type FormJson} from '@enonic/lib-admin-ui/form/json/FormJson';

export interface MixinDescriptorJson
    extends SchemaJson {

    form: FormJson;

    isOptional: boolean;

}
