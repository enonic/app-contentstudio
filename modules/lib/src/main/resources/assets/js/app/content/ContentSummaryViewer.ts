import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';
import {ContentIconUrlResolver} from './ContentIconUrlResolver';
import {ContentSummary} from './ContentSummary';
import {ContentPath} from './ContentPath';

export class ContentSummaryViewer
    extends NamesAndIconViewer<ContentSummary> {

    constructor() {
        super('content-summary-viewer');
    }

    resolveDisplayName(object: ContentSummary): string {
        let contentName = object.getName();
        let invalid = !object.isValid() || !object.getDisplayName() || contentName.isUnnamed();
        this.toggleClass('invalid', invalid);

        return object.getDisplayName();
    }

    resolveUnnamedDisplayName(object: ContentSummary): string {
        return object.getType() ? object.getType().getLocalName() : '';
    }

    resolveSubName(object: ContentSummary): string {
        let contentName = object.getName();
        if (this.isRelativePath) {
            return !contentName.isUnnamed() ? object.getName().toString() :
                NamePrettyfier.prettifyUnnamed();
        } else {
            return !contentName.isUnnamed() ? object.getPath().toString() :
                   ContentPath.create().fromParent(object.getPath().getParentPath(),
                       NamePrettyfier.prettifyUnnamed()).build().toString();
        }
    }

    resolveSubTitle(object: ContentSummary): string {
        return object.getPath().toString();
    }

    resolveIconUrl(object: ContentSummary): string {
        return new ContentIconUrlResolver().setContent(object).resolve();
    }
}
