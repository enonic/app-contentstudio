import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {ContentIconUrlResolver} from '../content/ContentIconUrlResolver';
import {ContentPath} from '../content/ContentPath';
import {ContentTreeSelectorItem} from './ContentTreeSelectorItem';

export class ContentTreeSelectorItemViewer
    extends NamesAndIconViewer<ContentTreeSelectorItem> {

    constructor() {
        super('content-tree-selector-item-viewer');
    }

    doLayout(object: ContentTreeSelectorItem) {
        super.doLayout(object);

        this.toggleClass('fake-root', object?.getPath().isRoot());
    }

    resolveDisplayName(object: ContentTreeSelectorItem): string {
        const contentName = object.getName();
        const displayName = object.getDisplayName();
        const invalid = object.getPath().isRoot() ? false : !object.isValid() || !displayName || contentName.isUnnamed();
        this.toggleClass('invalid', invalid);

        return displayName;
    }

    resolveUnnamedDisplayName(object: ContentTreeSelectorItem): string {
        return object.getType() ? object.getType().getLocalName() : '';
    }

    resolveSubName(object: ContentTreeSelectorItem, relativePath: boolean = false): string {
        const contentName = object.getName();
        let subName = '';
        if (relativePath) {
            subName = !contentName.isUnnamed() ? contentName.toString() : NamePrettyfier.prettifyUnnamed();
        } else {
            subName = !contentName.isUnnamed() ? object.getPath().toString() :
                   ContentPath.create().fromParent(object.getPath().getParentPath(), NamePrettyfier.prettifyUnnamed()).build().toString();
        }

        this.setTitle(subName);

        return subName;
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
