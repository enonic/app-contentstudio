import {ItemViewIconClassResolver} from '../ItemViewIconClassResolver';
import {FragmentComponent} from '../../app/page/region/FragmentComponent';

export class FragmentComponentViewer
    extends api.ui.NamesAndIconViewer<FragmentComponent> {

    constructor() {
        super();
    }

    resolveDisplayName(object: FragmentComponent): string {
        return !!object.getName() ? object.getName().toString() : '';
    }

    resolveSubName(object: FragmentComponent, relativePath: boolean = false): string {
        return object.getPath().toString();
    }

    resolveIconClass(object: FragmentComponent): string {
        return ItemViewIconClassResolver.resolveByType('fragment');
    }
}
