import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {type CustomSelectorItem} from './CustomSelectorItem';

export class CustomSelectorItemViewer
    extends NamesAndIconViewer<CustomSelectorItem> {

    resolveDisplayName(object: CustomSelectorItem): string {
        return object.displayName;
    }

    resolveSubName(object: CustomSelectorItem): string {
        return object.description;
    }

    resolveIconEl(object: CustomSelectorItem): Element {
        if (object.icon && object.icon.data) {
            return Element.fromCustomarilySanitizedString(object.icon.data, true, {addTags: ['use']});
        }
        return null;
    }

    resolveIconUrl(object: CustomSelectorItem): string {
        return object.iconUrl;
    }
}
