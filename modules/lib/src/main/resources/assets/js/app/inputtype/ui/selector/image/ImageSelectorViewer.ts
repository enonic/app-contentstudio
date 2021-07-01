import {ElementHelper} from 'lib-admin-ui/dom/ElementHelper';
import {MediaTreeSelectorItem} from '../media/MediaTreeSelectorItem';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';

export class ImageSelectorViewer
    extends NamesAndIconViewer<MediaTreeSelectorItem> {

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
        return object.getPath() ? object.getPath().toString() : '';
    }

    protected getHintTargetEl(): ElementHelper {
        return this.getEl();
    }

    getPreferredHeight(): number {
        return 40;
    }
}
