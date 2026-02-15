import {type PropertyArrayJson} from '@enonic/lib-admin-ui/data/PropertyArrayJson';
import {type RegionJson} from './region/RegionJson';
import {type ComponentTypeWrapperJson} from './region/ComponentTypeWrapperJson';

export interface PageJson {

    controller: string;

    template: string;

    regions: RegionJson[];

    fragment: ComponentTypeWrapperJson;

    config: PropertyArrayJson[];

}
