import {type DescriptorBasedComponentJson} from './DescriptorBasedComponentJson';
import {type RegionJson} from './RegionJson';

export interface LayoutComponentJson
    extends DescriptorBasedComponentJson {

    regions: RegionJson[];
}
