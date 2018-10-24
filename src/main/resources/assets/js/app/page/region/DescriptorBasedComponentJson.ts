import {ComponentJson} from './ComponentJson';

export interface DescriptorBasedComponentJson
    extends ComponentJson {

    descriptor: string;

    config: api.data.PropertyArrayJson[];
}
