import './../../api.ts';
import {ItemViewIconClassResolver} from '../ItemViewIconClassResolver';

export class PartComponentViewer
    extends api.ui.NamesAndIconViewer<api.content.page.region.PartComponent> {

    constructor() {
        super();
    }

    resolveDisplayName(object: api.content.page.region.PartComponent): string {
        return !!object.getName() ? object.getName().toString() : '';
    }

    resolveSubName(object: api.content.page.region.PartComponent, relativePath: boolean = false): string {
        return object.getPath().toString();
    }

    resolveIconClass(object: api.content.page.region.PartComponent): string {
        return ItemViewIconClassResolver.resolveByType('part');
    }
}
