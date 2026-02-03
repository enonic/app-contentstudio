import {SchemaJson} from '@enonic/lib-admin-ui/schema/SchemaJson';
import {FormJson} from '@enonic/lib-admin-ui/form/json/FormJson';

export interface MixinDescriptorJson
    extends SchemaJson {

    form: FormJson;

    isOptional: boolean;

}
