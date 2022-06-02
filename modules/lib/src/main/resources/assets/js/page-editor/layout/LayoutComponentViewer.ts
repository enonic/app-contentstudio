import {ItemViewIconClassResolver} from '../ItemViewIconClassResolver';
import {LayoutComponent} from '../../app/page/region/LayoutComponent';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';

export class LayoutComponentViewer
    extends NamesAndIconViewer<LayoutComponent> {

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
