import {ItemViewIconClassResolver} from '../ItemViewIconClassResolver';
import {LayoutComponent} from '../../app/page/region/LayoutComponent';

export class LayoutComponentViewer
    extends api.ui.NamesAndIconViewer<LayoutComponent> {

    constructor() {
        super();
    }

    resolveDisplayName(object: LayoutComponent): string {
        return !!object.getName() ? object.getName().toString() : '';
    }

    resolveSubName(object: LayoutComponent, relativePath: boolean = false): string {
        return object.getPath().toString();
    }

    resolveIconClass(object: LayoutComponent): string {
        return ItemViewIconClassResolver.resolveByType('layout');
    }
}
