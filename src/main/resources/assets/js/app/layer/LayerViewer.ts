import {ContentLayer} from '../content/ContentLayer';
import {LayerIcon} from './LayerIcon';

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
        return new LayerIcon(object.getLanguage());
    }

    resolveIconClass(): string {
        return 'icon-layers';
    }
}
