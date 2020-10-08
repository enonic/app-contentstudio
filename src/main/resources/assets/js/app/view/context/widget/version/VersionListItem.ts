import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {LiEl} from 'lib-admin-ui/dom/LiEl';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';
import {VersionViewer} from './VersionViewer';
import {VersionActionViewer} from './VersionActionViewer';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../../../event/EditContentEvent';
import {ContentVersion} from '../../../../ContentVersion';
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

export class VersionListItem
    extends LiEl {

    private readonly version: ContentVersion;
    private readonly content: ContentSummaryAndCompareStatus;
    private readonly activeVersionId: string;
    private tooltip: Tooltip;

    private versionViewers: [VersionViewer | VersionActionViewer];

    private expandable: boolean = false;
    private actionButton: ActionButton;

    constructor(version: ContentVersion, content: ContentSummaryAndCompareStatus, activeVersionId: string) {
        super('version-list-item');

        this.version = version;
        this.content = content;
        this.activeVersionId = activeVersionId; // do we need this???

        this.initElements();
    }

    private createVersionActionViewer() {
        const versionActionViewer = new VersionActionViewer();
        versionActionViewer.setObject(this.version.getPublishInfo());

        this.versionViewers = [versionActionViewer];

        if (this.version.getPublishInfo().getMessage()) {
            const messageBlock = new DivEl('publish-message');
            messageBlock.setHtml(this.version.getPublishInfo().getMessage());
            versionActionViewer.appendChild(messageBlock);
        }
    }

    private createVersionViewer() {
        this.expandable = true;

        const versionViewer = new VersionViewer();
        this.addOnClickHandler(versionViewer);
        versionViewer.setObject(this.version);
        if (this.version.isActive()) {
            versionViewer.addClass('active');
        } else {
            const compareButton = this.createCompareButton();
            versionViewer.appendChild(compareButton);
        }

        if (this.versionViewers) {
            this.versionViewers.push(versionViewer);
        } else {
            this.versionViewers = [versionViewer];
        }
    }

    private initElements() {
        this.createTooltip();

        if (this.version.hasPublishInfo()) {
            this.createVersionActionViewer();
        }
        if (!this.version.isUnpublished()) {
            this.createVersionViewer();
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

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {

            this.appendChildren(...this.versionViewers);

            return rendered;
        });
    }
}
