import {ItemViewIconClassResolver} from '../ItemViewIconClassResolver';
import {ImageComponent} from '../../app/page/region/ImageComponent';

export class ImageComponentViewer
    extends api.ui.NamesAndIconViewer<ImageComponent> {

    constructor() {
        super();
    }

    resolveDisplayName(object: ImageComponent): string {
        return !!object.getName() ? object.getName().toString() : '';
    }

    resolveSubName(object: ImageComponent, relativePath: boolean = false): string {
        return object.getPath().toString();
    }

    resolveIconClass(object: ImageComponent): string {
        return ItemViewIconClassResolver.resolveByType('image');
    }
}
