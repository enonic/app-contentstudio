import {ComponentJson} from './ComponentJson';

export interface ConfigBasedComponentJson
    extends ComponentJson {

    config: api.data.PropertyArrayJson[];

}
