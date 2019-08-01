import {ContentLayer} from '../content/ContentLayer';


export class LayerViewer
    extends api.ui.NamesAndIconViewer<ContentLayer> {

    constructor(className?: string) {
        super('layer-viewer ' + (className || ''));
    }

    resolveDisplayName(object: ContentLayer): string {
        return `${object.getDisplayName()} (${object.getName()})`;
    }

    resolveSubName(object: ContentLayer): string {
        return object.getDescription();
    }

    resolveIconEl(object: ContentLayer): api.dom.Element {
        // will implement later
        return null;
    }

    resolveIconClass(): string {
        return 'icon-layers';
    }

}
