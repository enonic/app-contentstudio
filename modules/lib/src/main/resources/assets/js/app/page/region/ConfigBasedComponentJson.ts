import {type ComponentJson} from './ComponentJson';
import {type PropertyArrayJson} from '@enonic/lib-admin-ui/data/PropertyArrayJson';

export interface ConfigBasedComponentJson
    extends ComponentJson {

    config: PropertyArrayJson[];

}
