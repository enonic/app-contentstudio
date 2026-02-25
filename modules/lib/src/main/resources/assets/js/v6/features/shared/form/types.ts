import type {FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';

export type FormItemRendererProps = {
    formItem: FormItem;
    propertySet: PropertySet;
};
