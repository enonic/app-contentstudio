import {ComponentJson} from './ComponentJson';
import {PropertyArrayJson} from 'lib-admin-ui/data/PropertyArrayJson';

export interface ConfigBasedComponentJson
    extends ComponentJson {

    config: PropertyArrayJson[];

}
