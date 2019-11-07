import {ItemViewIconClassResolver} from './ItemViewIconClassResolver';
import {Region} from '../app/page/region/Region';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';

export class RegionComponentViewer
    extends NamesAndIconViewer<Region> {

    constructor() {
        super();
    }

    resolveDisplayName(object: Region): string {
        return object.getName().toString();
    }

    resolveSubName(object: Region, relativePath: boolean = false): string {
        return object.getPath().toString();
    }

    resolveIconClass(object: Region): string {
        return ItemViewIconClassResolver.resolveByType('region');
    }
}
