import {ItemViewIconClassResolver} from './ItemViewIconClassResolver';
import {Region} from '../app/page/region/Region';

export class RegionComponentViewer
    extends api.ui.NamesAndIconViewer<Region> {

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
