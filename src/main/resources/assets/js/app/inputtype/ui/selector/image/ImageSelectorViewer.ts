import {MediaTreeSelectorItem} from '../media/MediaTreeSelectorItem';

export class ImageSelectorViewer
    extends api.ui.NamesAndIconViewer<MediaTreeSelectorItem> {

    constructor() {
        super('image-selector-viewer');
    }

    resolveDisplayName(object: MediaTreeSelectorItem): string {
        return object.getDisplayName();
    }

    resolveUnnamedDisplayName(object: MediaTreeSelectorItem): string {
        return object.getTypeLocaleName();
    }

    resolveSubName(object: MediaTreeSelectorItem): string {
        return object.getPath() ? object.getPath().toString() : '';
    }

    resolveIconUrl(object: MediaTreeSelectorItem): string {
        return object.getImageUrl() + '&size=270';
    }

    resolveHint(object: MediaTreeSelectorItem): string {
        return object.getPath().toString();
    }

    protected getHintTargetEl(): api.dom.ElementHelper {
        return this.getNamesAndIconView().getIconImageEl().getEl();
    }
}
