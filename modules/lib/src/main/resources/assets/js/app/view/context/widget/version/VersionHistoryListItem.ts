import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {LiEl} from '@enonic/lib-admin-ui/dom/LiEl';
import {VersionHistoryItemViewer} from './VersionHistoryItemViewer';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ActionButton} from '@enonic/lib-admin-ui/ui2/ActionButton';
import {ActionIcon} from '@enonic/lib-admin-ui/ui2/ActionIcon';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {CompareContentVersionsDialog} from '../../../../dialog/CompareContentVersionsDialog';
import {RevertVersionRequest} from '../../../../resource/RevertVersionRequest';
import * as $ from 'jquery';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Tooltip} from '@enonic/lib-admin-ui/ui/Tooltip';
import {VersionHistoryItem, VersionItemStatus} from './VersionHistoryItem';
import {VersionContext} from './VersionContext';
import * as Q from 'q';
import {VersionHistoryHelper} from './VersionHistoryHelper';
import {GitCompareArrows, GitCompareArrowsIcon} from 'lucide-react';

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

    private createVersionViewer(): VersionHistoryItemViewer {
        const versionViewer: VersionHistoryItemViewer = new VersionHistoryItemViewer();

        if (this.isInteractableItem()) {
            this.addOnClickHandler(versionViewer);
        }

        versionViewer.setObject(this.version);

        if (this.isCompareButtonRequired()) {
            const compareButton = this.createCompareButton();
            versionViewer.appendToNamesAndIconViewWrapper(compareButton);
        }

        if (this.version.getMessage()) {
            const messageBlock: DivEl = new DivEl('publish-message');
            messageBlock.setHtml(this.version.getMessage());
            versionViewer.appendChild(messageBlock);
        }

        versionViewer.toggleClass('interactable', this.isInteractableItem());
        versionViewer.toggleClass('active', this.isActive());

        return versionViewer;
    }

    private isCompareButtonRequired(): boolean {
        return this.isComparableItem() && this.version.getStatus() !== VersionItemStatus.CREATED;
    }

    private isInteractableItem(): boolean {
        return VersionHistoryHelper.isInteractableItem(this.version);
    }

    private isComparableItem(): boolean {
        return VersionHistoryHelper.isComparableItem(this.version);
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
        return new ActionButton({
            action: new Action(i18n('text.activeVersion')),
        });
    }

    private createRevertButton(): ActionButton {
        const revertAction = new Action(i18n('field.version.revert'));

        if (this.content.isReadOnly()) {
            revertAction.setEnabled(false);
        } else {
            revertAction.setTitle(i18n('field.version.makeCurrent'));
            revertAction.onExecuted(() => {
                this.revert(this.version.getId(), this.version.getDateTime());
            });
        }

        return new ActionButton({
            action: revertAction,
        });
    }

    private createCompareButton(): ActionIcon {
        const action = new Action();
        action.setTitle(i18n('text.versions.showChanges'));
        action.onExecuted(this.openCompareDialog.bind(this));

        return new ActionIcon({action, icon: GitCompareArrows, className: ''});
    }

    private openCompareDialog() {
        CompareContentVersionsDialog.get()
            .setContent(this.content)
            .setReadOnly(this.content.isReadOnly())
            .setRightVersion(this.version)
            .resetLeftVersion()
            .setRevertVersionCallback(this.revert.bind(this))
            .open();
    }

    private revert(versionId: string, versionDate: Date) {
        const contentIdAsString: string = this.content.getContentId().toString();

        new RevertVersionRequest(versionId, this.content.getContentId())
            .sendAndParse()
            .then((newVersionId: string) => {
                if (newVersionId === VersionContext.getActiveVersion(contentIdAsString)) {
                    NotifyManager.get().showFeedback(i18n('notify.revert.noChanges'));
                    return;
                }

                const dateTime = `${DateHelper.formatDateTime(versionDate)}`;
                NotifyManager.get().showSuccess(i18n('notify.version.changed', dateTime));

                VersionContext.setActiveVersion(contentIdAsString, newVersionId);
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

    private addOnClickHandler(viewer: VersionHistoryItemViewer) {
        viewer.onClicked(() => {
            this.collapseAllExpandedSiblings();
            this.toggleTooltip();
            this.toggleClass('expanded');

            if (this.hasClass('expanded') && !this.actionButton) {
                this.actionButton = this.isActive() ? this.createActiveVersionButton() : this.createRevertButton();
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

    private isActive(): boolean {
        return VersionContext.isActiveVersion(this.version.getContentIdAsString(), this.version.getId());
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
