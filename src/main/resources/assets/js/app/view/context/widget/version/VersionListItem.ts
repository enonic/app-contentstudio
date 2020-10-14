import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {LiEl} from 'lib-admin-ui/dom/LiEl';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';
import {VersionViewer} from './VersionViewer';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../../../event/EditContentEvent';
import {CompareContentVersionsDialog} from '../../../../dialog/CompareContentVersionsDialog';
import {RevertVersionRequest} from '../../../../resource/RevertVersionRequest';
import {ActiveContentVersionSetEvent} from '../../../../event/ActiveContentVersionSetEvent';
import * as $ from 'jquery';
import {i18n} from 'lib-admin-ui/util/Messages';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {Action} from 'lib-admin-ui/ui/Action';
import {Tooltip} from 'lib-admin-ui/ui/Tooltip';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {VersionHistoryItem} from './VersionHistoryItem';

export class VersionListItem
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

    private createVersionViewer(): VersionViewer {
        const versionViewer = new VersionViewer();
        if (this.version.isRevertable()) {
            this.addOnClickHandler(versionViewer);
        }
        versionViewer.setObject(this.version);
        if (!this.version.isActive() && !this.version.isPublishAction()) {
            const compareButton = this.createCompareButton();
            versionViewer.appendChild(compareButton);
        }

        if (this.version.getMessage()) {
            const messageBlock = new DivEl('publish-message');
            messageBlock.setHtml(this.version.getMessage());
            versionViewer.appendChild(messageBlock);
        }

        return versionViewer;
    }

    private createTooltip() {

        if (!this.version.getMessage()) {
            return;
        }

        this.tooltip = new Tooltip(this, this.version.getMessage().trim(), 1000);
    }

    private createEditButton(): ActionButton {
        const editButton: ActionButton = new ActionButton(new Action(i18n('action.edit')));

        if (this.content.isReadOnly()) {
            editButton.setEnabled(false);
        } else {
            editButton.getAction().onExecuted(() => {
                new EditContentEvent([this.content]).fire();
            });
        }

        return editButton;
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
                this.revert();
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
            //.setLeftVersion(this.version)
            .setRevertVersionCallback(this.revert.bind(this))
            .open();
    }

    private revert() {
        new RevertVersionRequest(this.version.getId(), this.content.getContentId().toString())
            .sendAndParse()
            .then(() => {
                const modifiedDate = this.version.getDateTime();
                const dateTime = `${DateHelper.formatDateTime(modifiedDate)}`;

                NotifyManager.get().showSuccess(i18n('notify.version.changed', dateTime));
                new ActiveContentVersionSetEvent(this.content.getContentId(), this.version.getId()).fire();
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

    private addOnClickHandler(viewer: VersionViewer) {
        viewer.onClicked(() => {
            this.collapseAllExpandedSiblings();
            this.toggleTooltip();
            this.toggleClass('expanded');

            if (this.hasClass('expanded') && !this.actionButton) {
                this.actionButton = this.version.isActive() ? this.createEditButton() : this.createRevertButton();
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
