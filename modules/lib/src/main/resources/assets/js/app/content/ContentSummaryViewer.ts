import { NamesAndIconViewer } from 'lib-admin-ui/ui/NamesAndIconViewer';
import {ContentUnnamed} from 'lib-admin-ui/content/ContentUnnamed';
import { ContentPath } from 'lib-admin-ui/content/ContentPath';
import {ContentIconUrlResolver} from './ContentIconUrlResolver';
import {ContentSummary} from './ContentSummary';

export class ContentSummaryViewer
    extends NamesAndIconViewer<ContentSummary> {

    constructor() {
        super('content-summary-viewer');
    }

    resolveDisplayName(object: ContentSummary): string {
        let contentName = object.getName();
        let invalid = !object.isValid() || !object.getDisplayName() || contentName.isUnnamed();
        let pendingDelete = object.getContentState().isPendingDelete();
        this.toggleClass('invalid', invalid);
        this.toggleClass('pending-delete', pendingDelete);

        return object.getDisplayName();
    }

    resolveUnnamedDisplayName(object: ContentSummary): string {
        return object.getType() ? object.getType().getLocalName() : '';
    }

    resolveSubName(object: ContentSummary): string {
        let contentName = object.getName();
        if (this.isRelativePath) {
            return !contentName.isUnnamed() ? object.getName().toString() :
                   ContentUnnamed.prettifyUnnamed();
        } else {
            return !contentName.isUnnamed() ? object.getPath().toString() :
                   ContentPath.fromParent(object.getPath().getParentPath(),
                       ContentUnnamed.prettifyUnnamed()).toString();
        }
    }

    resolveSubTitle(object: ContentSummary): string {
        return object.getPath().toString();
    }

    resolveIconUrl(object: ContentSummary): string {
        return new ContentIconUrlResolver().setContent(object).resolve();
    }
}
