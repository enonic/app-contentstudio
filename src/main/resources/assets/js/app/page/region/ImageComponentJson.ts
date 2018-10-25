import {ComponentJson} from './ComponentJson';

export interface ImageComponentJson
    extends ComponentJson {

    image: string;

    config: api.data.PropertyArrayJson[];
}
