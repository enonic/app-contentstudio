import {ElementHelper} from 'lib-admin-ui/dom/ElementHelper';
import {CompareStatus} from '../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {ContentIconUrlResolver} from 'lib-admin-ui/content/util/ContentIconUrlResolver';

export class DependantItemViewer
    extends NamesAndIconViewer<ContentSummaryAndCompareStatus> {

    constructor() {
        super('dependant-item-viewer');
    }

    resolveDisplayName(object: ContentSummaryAndCompareStatus): string {
        let pendingDelete = (CompareStatus.PENDING_DELETE === object.getCompareStatus());

        this.toggleClass('pending-delete', pendingDelete);
        return object.getPath().toString();
    }

    resolveSubName(object: ContentSummaryAndCompareStatus): string {
        return super.resolveSubName(object);
    }

    resolveIconUrl(object: ContentSummaryAndCompareStatus): string {
        if(! object.getType().isImage()) {
            return new ContentIconUrlResolver().setContent(object.getContentSummary()).resolve();
        }
    }

    resolveIconClass (object: ContentSummaryAndCompareStatus): string {
        if(object.getType().isImage()) {
            return 'image';
        }
    }

    resolveHint(object: ContentSummaryAndCompareStatus): string {
        return object.getPath().toString();
    }

    protected getHintTargetEl(): ElementHelper {
        return this.getNamesAndIconView().getEl();
    }
}
