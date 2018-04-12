import './../api.ts';
import {ItemViewIconClassResolver} from './ItemViewIconClassResolver';

export class RegionComponentViewer
    extends api.ui.NamesAndIconViewer<api.content.page.region.Region> {

    constructor() {
        super();
    }

    resolveDisplayName(object: api.content.page.region.Region): string {
        return object.getName().toString();
    }

    resolveSubName(object: api.content.page.region.Region, relativePath: boolean = false): string {
        return object.getPath().toString();
    }

    resolveIconClass(object: api.content.page.region.Region): string {
        return ItemViewIconClassResolver.resolveByType('region');
    }
}
