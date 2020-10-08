import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {LiEl} from 'lib-admin-ui/dom/LiEl';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';
import {ContentVersionViewer} from './ContentVersionViewer';
import {VersionViewer} from './VersionViewer';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../../../event/EditContentEvent';
import {ContentVersion} from '../../../../ContentVersion';
import {PublishStatus, PublishStatusFormatter} from '../../../../publish/PublishStatus';
import {CompareStatus, CompareStatusFormatter} from '../../../../content/CompareStatus';
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
import {VersionInfoBlock} from './VersionInfoBlock';

export class VersionListItem
    extends LiEl {

    private readonly version: ContentVersion;
    private readonly content: ContentSummaryAndCompareStatus;
    private readonly activeVersionId: string;
    private tooltip: Tooltip;

    private versionViewer: VersionViewer;
    private versionInfoBlock: VersionInfoBlock;

    private actionButton: ActionButton;
    private compareButton: ActionButton;

    constructor(version: ContentVersion, content: ContentSummaryAndCompareStatus, activeVersionId: string) {
        super('version-list-item');

        this.version = version;
        this.content = content;
        this.activeVersionId = activeVersionId; // do we need this???

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.createTooltip();/*
        this.descriptionBlock = new ContentVersionViewer();
        this.descriptionBlock.setObject(this.version);*/
        this.versionViewer = new VersionViewer();
        this.versionViewer.setObject(this.version);
        this.versionInfoBlock = new VersionInfoBlock(this.version);
        this.actionButton = this.version.isActive() ? this.createEditButton() : this.createRevertButton();

        if (!this.version.isActive()) {
            const compareButton = this.createCompareButton();
            this.versionViewer.appendChild(compareButton);
        }
    }

    private createTooltip() {

        if (!this.version.getPublishInfo() || !this.version.getPublishInfo().getMessage()) {
            return;
        }

        this.tooltip = new Tooltip(this, this.version.getPublishInfo().getMessage().trim(), 1000);
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
                this.revert(this.getContentId(), this.version);
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

    private initListeners() {
        this.addOnClickHandler();
    }

    private openCompareDialog() {
        CompareContentVersionsDialog.get()
            .setContent(this.content.getContentSummary())
            .setLeftVersion(this.version)
            .setRevertVersionCallback(this.revert.bind(this))
            .open();
    }

    private revert(contentId: ContentId, version: ContentVersion) {
        new RevertVersionRequest(version.getId(), contentId.toString())
            .sendAndParse()
            .then((newVersionId) => {

                if (newVersionId === this.activeVersionId) {
                    NotifyManager.get().showFeedback(i18n('notify.revert.noChanges'));
                    return;
                }

                const modifiedDate = version.getModified();
                const dateTime = `${DateHelper.formatDateTime(modifiedDate)}`;

                NotifyManager.get().showSuccess(i18n('notify.version.changed', dateTime));
                new ActiveContentVersionSetEvent(contentId, version.getId()).fire();
            })
            .catch(DefaultErrorHandler.handle);
    }

    private getContentId(): ContentId {
        return this.content ? this.content.getContentId() : null;
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

    private addOnClickHandler() {
        this.onClicked(() => {
            this.collapseAllExpandedSiblings();
            this.toggleTooltip();
            this.toggleClass('expanded');
        });
    }

    private collapseAllExpandedSiblings() {
        $(this.getHTMLElement())
            .siblings('.expanded')
            .removeClass('expanded');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.versionInfoBlock.appendChild(this.actionButton);
            //this.versionViewer.appendChild(this.compareButton);

            this.appendChildren(this.versionViewer);
            this.appendChild(this.versionInfoBlock);

            return rendered;
        });
    }
}
