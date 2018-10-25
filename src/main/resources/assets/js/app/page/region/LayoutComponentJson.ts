import {DescriptorBasedComponentJson} from './DescriptorBasedComponentJson';
import {RegionJson} from './RegionJson';

export interface LayoutComponentJson
    extends DescriptorBasedComponentJson {

    regions: RegionJson[];
}
