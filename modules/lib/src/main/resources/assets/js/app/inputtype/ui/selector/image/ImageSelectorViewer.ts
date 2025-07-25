import {ElementHelper} from '@enonic/lib-admin-ui/dom/ElementHelper';
import {MediaTreeSelectorItem} from '../media/MediaTreeSelectorItem';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';

export class ImageSelectorViewer
    extends NamesAndIconViewer<MediaTreeSelectorItem> {

    constructor() {
        super('gallery-item-viewer');
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

    doLayout(object: MediaTreeSelectorItem): void {
        super.doLayout(object);

        this.namesAndIconView?.getIconImageEl()?.getEl().setAttribute('draggable', 'false');
    }

    protected getHintTargetEl(): ElementHelper {
        return this.getEl();
    }

}
