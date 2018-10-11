import {CompareStatus} from '../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class DependantItemViewer extends api.ui.NamesAndIconViewer<ContentSummaryAndCompareStatus> {

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
            return new api.content.util.ContentIconUrlResolver().setContent(object.getContentSummary()).resolve();
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

    protected getHintTargetEl(): api.dom.ElementHelper {
        return this.getNamesAndIconView().getEl();
    }
}
