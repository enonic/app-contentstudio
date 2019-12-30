import {ContentUnnamed} from 'lib-admin-ui/content/ContentUnnamed';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentTreeSelectorItem} from './ContentTreeSelectorItem';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {ContentIconUrlResolver} from 'lib-admin-ui/content/util/ContentIconUrlResolver';

export class ContentTreeSelectorItemViewer
    extends NamesAndIconViewer<ContentTreeSelectorItem> {

    constructor() {
        super('content-tree-selector-item-viewer');
    }

    resolveDisplayName(object: ContentTreeSelectorItem): string {
        const contentName = object.getName();
        const displayName = object.getDisplayName();
        const invalid = !object.isValid() || !displayName || contentName.isUnnamed();
        const pendingDelete = object.getContentState().isPendingDelete();
        this.toggleClass('invalid', invalid);
        this.toggleClass('pending-delete', pendingDelete);
        this.getEl().setTitle(displayName);

        return displayName;
    }

    resolveUnnamedDisplayName(object: ContentTreeSelectorItem): string {
        return object.getType() ? object.getType().getLocalName() : '';
    }

    resolveSubName(object: ContentTreeSelectorItem, relativePath: boolean = false): string {
        let contentName = object.getName();
        if (relativePath) {
            return !contentName.isUnnamed() ? object.getName().toString() : ContentUnnamed.prettifyUnnamed();
        } else {
            return !contentName.isUnnamed() ? object.getPath().toString() :
                   ContentPath.fromParent(object.getPath().getParentPath(), ContentUnnamed.prettifyUnnamed()).toString();
        }
    }

    resolveSubTitle(object: ContentTreeSelectorItem): string {
        return object.getPath().toString();
    }

    resolveIconUrl(object: ContentTreeSelectorItem): string {
        if (object) {
            return new ContentIconUrlResolver().setContent(object.getContent()).resolve();
        }
    }
}
