import {PropertyArrayJson} from 'lib-admin-ui/data/PropertyArrayJson';
import {ComponentJson} from './region/ComponentJson';
import {RegionJson} from './region/RegionJson';

export interface PageJson {

    controller: string;

    template: string;

    regions: RegionJson[];

    fragment: ComponentJson;

    config: PropertyArrayJson[];

    customized: boolean;

}
