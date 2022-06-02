import {ComponentJson} from './ComponentJson';
import {PropertyArrayJson} from '@enonic/lib-admin-ui/data/PropertyArrayJson';

export interface ConfigBasedComponentJson
    extends ComponentJson {

    config: PropertyArrayJson[];

}
