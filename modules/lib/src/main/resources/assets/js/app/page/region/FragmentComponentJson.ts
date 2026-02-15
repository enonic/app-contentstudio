import {type ConfigBasedComponentJson} from './ConfigBasedComponentJson';

export interface FragmentComponentJson
    extends ConfigBasedComponentJson {

    fragment: string;
}
