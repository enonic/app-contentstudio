import {ElementHelper} from 'lib-admin-ui/dom/ElementHelper';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentIconUrlResolver} from 'lib-admin-ui/content/util/ContentIconUrlResolver';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';

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
