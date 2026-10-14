import { type SchemaJson } from '@enonic/lib-admin-ui/schema/SchemaJson';
import type { FormJson } from '@enonic/ui-types';

export interface MixinDescriptorJson extends SchemaJson {
    form: FormJson;

    isOptional: boolean;
}
