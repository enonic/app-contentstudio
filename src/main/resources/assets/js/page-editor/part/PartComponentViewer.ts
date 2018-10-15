import {ItemViewIconClassResolver} from '../ItemViewIconClassResolver';
import {PartComponent} from '../../app/page/region/PartComponent';

export class PartComponentViewer
    extends api.ui.NamesAndIconViewer<PartComponent> {

    constructor() {
        super();
    }

    resolveDisplayName(object: PartComponent): string {
        return !!object.getName() ? object.getName().toString() : '';
    }

    resolveSubName(object: PartComponent, relativePath: boolean = false): string {
        return object.getPath().toString();
    }

    resolveIconClass(object: PartComponent): string {
        return ItemViewIconClassResolver.resolveByType('part');
    }
}
