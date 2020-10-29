import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {LangBasedContentSummaryViewer} from '../../view/context/widget/layers/LangBasedContentSummaryViewer';
import {CompareStatusFormatter} from '../../content/CompareStatus';
import {DivEl} from 'lib-admin-ui/dom/DivEl';

export class LayersContentTreeListItemViewer extends LangBasedContentSummaryViewer {

    private statusView: DivEl;

    resolveDisplayName(object: ContentSummaryAndCompareStatus): string {
        if (object) {
            return super.resolveDisplayName(object);
        }

        return i18n('field.unnamed');
    }

    resolveSubName(object: ContentSummaryAndCompareStatus): string {
        return this.project.getName() + (this.project.getLanguage() ? ` (${this.project.getLanguage()})` : '');
    }

    doLayout(object: ContentSummaryAndCompareStatus) {
        super.doLayout(object);

        if (!!object) {
            this.statusView = new DivEl('status');
            this.statusView.setHtml(CompareStatusFormatter.formatStatusText(object.getCompareStatus()));
            this.statusView.addClass(CompareStatusFormatter.formatStatusClass(object.getCompareStatus()));
            this.appendChild(this.statusView);
        }
    }

}
