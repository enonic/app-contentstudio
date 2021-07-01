import {Element} from 'lib-admin-ui/dom/Element';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {CustomSelectorItem} from './CustomSelectorItem';

export class CustomSelectorItemViewer
    extends NamesAndIconViewer<CustomSelectorItem> {

    constructor() {
        super('custom-selector-item-viewer');
    }

    resolveDisplayName(object: CustomSelectorItem): string {
        return object.displayName;
    }

    resolveSubName(object: CustomSelectorItem): string {
        return object.description;
    }

    resolveIconEl(object: CustomSelectorItem): Element {
        if (object.icon && object.icon.data) {
            return Element.fromString(object.icon.data);
        }
        return null;
    }

    resolveIconUrl(object: CustomSelectorItem): string {
        return object.iconUrl;
    }

    getPreferredHeight(): number {
        return 40;
    }
}
