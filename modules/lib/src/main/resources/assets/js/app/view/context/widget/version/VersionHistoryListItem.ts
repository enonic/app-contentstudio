import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {LiEl} from '@enonic/lib-admin-ui/dom/LiEl';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {VersionHistoryListItemViewer} from './VersionHistoryListItemViewer';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {CompareContentVersionsDialog} from '../../../../dialog/CompareContentVersionsDialog';
import {RevertVersionRequest} from '../../../../resource/RevertVersionRequest';
import {ActiveContentVersionSetEvent} from '../../../../event/ActiveContentVersionSetEvent';
import * as $ from 'jquery';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Tooltip} from '@enonic/lib-admin-ui/ui/Tooltip';
import {VersionHistoryItem} from './VersionHistoryItem';

export class VersionHistoryListItem
    extends LiEl {

    private readonly version: VersionHistoryItem;
    private readonly content: ContentSummaryAndCompareStatus;
    private tooltip: Tooltip;
    private actionButton: ActionButton;

    constructor(version: VersionHistoryItem, content: ContentSummaryAndCompareStatus) {
        super('version-list-item');

        this.version = version;
        this.content = content;
    }

    private createVersionViewer(): VersionHistoryListItemViewer {
        const versionViewer: VersionHistoryListItemViewer = new VersionHistoryListItemViewer();

        if (this.version.isRevertable() || this.version.isActive()) {
            this.addOnClickHandler(versionViewer);
        }

        if (this.version.isRevertable()) {
            ActiveContentVersionSetEvent.on((event: ActiveContentVersionSetEvent) => {
                this.version.setActiveVersionId(event.getVersionId());
            });
        }

        versionViewer.setObject(this.version);

        if (this.isCompareButtonRequired()) {
            const compareButton: ActionButton = this.createCompareButton();
            versionViewer.appendToNamesAndIconViewWrapper(compareButton);
        }

        if (this.version.getMessage()) {
            const messageBlock: DivEl = new DivEl('publish-message');
            messageBlock.setHtml(this.version.getMessage());
            versionViewer.appendChild(messageBlock);
        }

        return versionViewer;
    }

    private isCompareButtonRequired(): boolean {
        return !this.version.isActive() &&
               !this.version.isPublishAction() &&
               !this.version.isSorted() &&
               !this.version.isPermissionsUpdated();
    }

    private createTooltip() {
        if (!this.version.isPublishAction()) {
            return;
        }

        if (!this.version.getActiveFrom() && !this.version.getActiveTo()) {
            return;
        }

        this.tooltip = new Tooltip(this, this.getTooltipText(), 1000);
    }

    private getTooltipText(): string {
        let tooltip = i18n('tooltip.state.published',
            DateHelper.formatDateTime(this.version.getDateTime(), false),
            this.version.getUser(),
        );

        if (!!this.version.getActiveFrom()) {
            tooltip += ' ' + i18n('tooltip.from', DateHelper.formatDateTime(this.version.getActiveFrom(), false));
        }

        if (!!this.version.getActiveTo()) {
            tooltip += ' ' + i18n('tooltip.to', DateHelper.formatDateTime(this.version.getActiveTo(), false));
        }

        return tooltip;
    }

    private createActiveVersionButton(): ActionButton {
        return new ActionButton(new Action(i18n('text.activeVersion')));
    }

    private createRevertButton(): ActionButton {
        const revertButton: ActionButton = new ActionButton(new Action(i18n('field.version.revert')), false);

        if (this.content.isReadOnly()) {
            revertButton.setEnabled(false);
        } else {
            revertButton.setTitle(i18n('field.version.makeCurrent'));
            revertButton.onClicked((event: MouseEvent) => {
                event.preventDefault();
                event.stopPropagation();
            });
            revertButton.getAction().onExecuted(() => {
                this.revert(this.version.getId(), this.version.getDateTime());
            });
        }

        return revertButton;
    }

    private createCompareButton(): ActionButton {
        const compareButton: ActionButton = new ActionButton(new Action(), false);

        compareButton
            .setTitle(i18n('tooltip.widget.versions.compareWithCurrentVersion'))
            .addClass('compare icon-compare icon-medium transparent');

        compareButton.getAction().onExecuted(this.openCompareDialog.bind(this));

        return compareButton;
    }

    private openCompareDialog() {
        CompareContentVersionsDialog.get()
            .setContent(this.content.getContentSummary())
            .setReadOnly(this.content.isReadOnly())
            .setLeftVersion(this.version.getId())
            .resetRightVersion()
            .setRevertVersionCallback(this.revert.bind(this))
            .open();
    }

    private revert(versionId: string, versionDate: Date, activeVersionId?: string) {
        const currentActiveVersionId = activeVersionId ? activeVersionId : this.version.getActiveVersionId();
        new RevertVersionRequest(versionId, this.content.getContentId().toString())
            .sendAndParse()
            .then((newVersionId: string) => {
                if (newVersionId === currentActiveVersionId) {
                    NotifyManager.get().showFeedback(i18n('notify.revert.noChanges'));
                    return;
                }

                const dateTime = `${DateHelper.formatDateTime(versionDate)}`;
                NotifyManager.get().showSuccess(i18n('notify.version.changed', dateTime));

                new ActiveContentVersionSetEvent(this.content.getContentId(), newVersionId).fire();
            })
            .catch(DefaultErrorHandler.handle);
    }

    private toggleTooltip() {
        if (!this.tooltip) {
            return;
        }

        const isActive = this.hasClass('expanded');
        this.tooltip.setActive(isActive);
        if (isActive) {
            this.tooltip.show();
        } else {
            this.tooltip.hide();
        }
    }

    private addOnClickHandler(viewer: VersionHistoryListItemViewer) {
        viewer.onClicked(() => {
            this.collapseAllExpandedSiblings();
            this.toggleTooltip();
            this.toggleClass('expanded');

            if (this.hasClass('expanded') && !this.actionButton) {
                this.actionButton = this.version.isActive() ? this.createActiveVersionButton() : this.createRevertButton();
                this.actionButton.addClass('version-action-button');
                viewer.appendChild(this.actionButton);
            }
        });
    }

    private collapseAllExpandedSiblings() {
        $(this.getHTMLElement())
            .siblings('.expanded')
            .removeClass('expanded');
    }

    private createVersionDateBlock(date: Date): DivEl {
        const dateDiv: DivEl = new DivEl('version-date');
        dateDiv.setHtml(DateHelper.formatDate(date));

        return dateDiv;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.createTooltip();

            if (!this.version.skipsDate()) {
                this.appendChild(this.createVersionDateBlock(this.version.getDateTime()));
            }

            this.appendChild(this.createVersionViewer());

            return rendered;
        });
    }
}
