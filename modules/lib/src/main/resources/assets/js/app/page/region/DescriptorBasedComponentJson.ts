import {type ConfigBasedComponentJson} from './ConfigBasedComponentJson';

export interface DescriptorBasedComponentJson
    extends ConfigBasedComponentJson {

    descriptor: string;
}
