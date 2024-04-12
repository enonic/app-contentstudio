import {PropertyArrayJson} from '@enonic/lib-admin-ui/data/PropertyArrayJson';
import {RegionJson} from './region/RegionJson';
import {ComponentTypeWrapperJson} from './region/ComponentTypeWrapperJson';

export interface PageJson {

    controller: string;

    template: string;

    regions: RegionJson[];

    fragment: ComponentTypeWrapperJson;

    config: PropertyArrayJson[];

}
