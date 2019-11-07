import {ContentWizardPanelParams} from '../wizard/ContentWizardPanelParams';
import {ContentEventsProcessor} from '../ContentEventsProcessor';
import {ToggleSearchPanelWithDependenciesGlobalEvent} from '../browse/ToggleSearchPanelWithDependenciesGlobalEvent';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {AEl} from 'lib-admin-ui/dom/AEl';
import {AppBarTabId} from 'lib-admin-ui/app/bar/AppBarTabId';
import {i18n} from 'lib-admin-ui/util/Messages';

export class DeleteItemViewer
    extends ContentSummaryAndCompareStatusViewer {

    constructor() {
        super();
        this.addClass('delete-item-viewer');
    }

    setInboundDependencyCount(value: number) {
        if (value === 0) {
            return;
        }

        const inboundDependencyEl = new AEl('inbound-dependency');

        inboundDependencyEl.setHtml((value === 1 ? i18n('dialog.delete.dependency') : i18n('dialog.delete.dependencies')) + ': ' + value);

        inboundDependencyEl.onClicked(() => {

            const contentSummary = this.getObject().getContentSummary();

            let tabId = new AppBarTabId('browse', contentSummary.getId());

            let wizardParams = new ContentWizardPanelParams()
                .setTabId(tabId)
                .setContentTypeName(contentSummary.getType())
                .setContentId(contentSummary.getContentId());

            let win = ContentEventsProcessor.openWizardTab(wizardParams, tabId);

            setTimeout(() => {
                new ToggleSearchPanelWithDependenciesGlobalEvent(this.getObject().getContentSummary(), true).fire(win);
            }, 1000);
        });

        this.appendChild(inboundDependencyEl);
    }
}
