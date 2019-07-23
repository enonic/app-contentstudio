import {ContentLayer} from '../../../../content/ContentLayer';

export class LayerWidgetViewer
    extends api.ui.NamesAndIconViewer<ContentLayer> {

    constructor() {
        super('layer-widget-item-viewer');
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
