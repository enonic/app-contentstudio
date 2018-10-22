import {ComponentJson} from './ComponentJson';

export interface FragmentComponentJson
    extends ComponentJson {

    fragment: string;

    config: api.data.PropertyArrayJson[];
}
