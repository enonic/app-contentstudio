import {type ElementHelper} from '@enonic/lib-admin-ui/dom/ElementHelper';
import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {ContentIconUrlResolver} from '../content/ContentIconUrlResolver';

export class DependantItemViewer
    extends ContentSummaryAndCompareStatusViewer {

    resolveDisplayName(object: ContentSummaryAndCompareStatus): string {
        return object.getPath().toString();
    }

    resolveIconUrl(object: ContentSummaryAndCompareStatus): string {
        if (!object.getType().isImage()) {
            return new ContentIconUrlResolver().setContent(object.getContentSummary()).resolve();
        }
    }

    resolveIconClass(object: ContentSummaryAndCompareStatus): string {
        if (object.getType().isImage()) {
            return 'icon-image';
        }
    }

    resolveHint(object: ContentSummaryAndCompareStatus): string {
        return object.getPath().toString();
    }

    protected getHintTargetEl(): ElementHelper {
        return this.getNamesAndIconView().getEl();
    }
}
