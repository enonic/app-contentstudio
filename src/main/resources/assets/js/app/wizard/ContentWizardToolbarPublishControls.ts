import {ContentWizardActions} from './action/ContentWizardActions';
import {CompareStatusFormatter} from '../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentWizardPublishMenuButton} from '../browse/ContentWizardPublishMenuButton';
import Action = api.ui.Action;
import ActionButton = api.ui.button.ActionButton;
import i18n = api.util.i18n;

export class ContentWizardToolbarPublishControls
    extends api.dom.DivEl {

    private publishButton: ContentWizardPublishMenuButton;
    private publishAction: Action;
    private createIssueAction: Action;
    private unpublishAction: Action;
    private publishMobileAction: Action;
    private markAsReadyAction: Action;
    private requestPublishAction: Action;
    private showRequestAction: Action;
    private contentCanBePublished: boolean = false;
    private userCanPublish: boolean = true;
    private isContentValid: boolean = false;
    private hasPublishRequest: boolean = false;
    private content: ContentSummaryAndCompareStatus;
    private publishButtonForMobile: ActionButton;

    constructor(actions: ContentWizardActions) {
        super('toolbar-publish-controls');

        this.publishAction = actions.getPublishAction();
        this.publishAction.setIconClass('publish-action');
        this.createIssueAction = actions.getCreateIssueAction();
        this.unpublishAction = actions.getUnpublishAction();
        this.publishMobileAction = actions.getPublishMobileAction();
        this.markAsReadyAction = actions.getMarkAsReadyAction();
        this.requestPublishAction = actions.getRequestPublishAction();
        this.showRequestAction = actions.getOpenRequestAction();

        this.publishButton = new ContentWizardPublishMenuButton({
            publishAction: this.publishAction,
            unpublishAction: this.unpublishAction,
            markAsReadyAction: this.markAsReadyAction,
            createIssueAction: this.createIssueAction,
            requestPublishAction: this.requestPublishAction,
            openRequestAction: this.showRequestAction
        });
        this.publishButton.addClass('content-wizard-toolbar-publish-button');

        this.publishButtonForMobile = new ActionButton(this.publishMobileAction);
        this.publishButtonForMobile.addClass('mobile-edit-publish-button');
        this.publishButtonForMobile.setVisible(false);

        this.appendChild(this.publishButton);

        actions.onBeforeActionsStashed(() => {
            this.publishButton.setRefreshDisabled(true);
        });

        actions.onActionsUnstashed(() => {
            this.publishButton.setRefreshDisabled(false);
        });

        this.publishButton.onPublishRequestActionChanged((added: boolean) => {
            this.hasPublishRequest = added;
            this.refreshState();
        });

    }

    setContent(content: ContentSummaryAndCompareStatus, refresh: boolean = true): ContentWizardToolbarPublishControls {
        this.content = content;
        this.publishButton.setItem(content);
        if (refresh) {
            this.refreshState();
        }
        return this;
    }

    setContentCanBePublished(value: boolean, refresh: boolean = true): ContentWizardToolbarPublishControls {
        this.contentCanBePublished = value;
        if (refresh) {
            this.refreshState();
        }
        return this;
    }

    setUserCanPublish(value: boolean, refresh: boolean = true): ContentWizardToolbarPublishControls {
        this.userCanPublish = value;
        if (refresh) {
            this.refreshState();
        }
        return this;
    }

    setIsValid(value: boolean): ContentWizardToolbarPublishControls {
        const isRefreshNeeded: boolean = value !== this.isContentValid;
        this.isContentValid = value;
        if (isRefreshNeeded) {
            this.refreshState();
        }
        return this;
    }

    refreshState() {

        if (!this.content) {
            return;
        }

        this.doRefreshState();
    }

    private doRefreshState() {
        const canBePublished: boolean = !this.isOnline() && this.contentCanBePublished && this.userCanPublish;
        const canBeUnpublished: boolean = this.content.isPublished() && this.userCanPublish;
        const canBeMarkedAsReady: boolean = this.isContentValid && !this.content.isOnline() && !this.content.getContentSummary().isReady();
        const canBeRequestedPublish: boolean = this.isContentValid && !this.content.isOnline() && !this.content.isPendingDelete();

        this.publishAction.setEnabled(canBePublished);
        this.createIssueAction.setEnabled(true);
        this.unpublishAction.setEnabled(canBeUnpublished);
        this.publishMobileAction.setEnabled(canBePublished);
        this.publishMobileAction.setVisible(canBePublished);
        this.markAsReadyAction.setEnabled(canBeMarkedAsReady);
        this.requestPublishAction.setEnabled(canBeRequestedPublish);
        this.showRequestAction.setEnabled(this.hasPublishRequest);
        this.showRequestAction.setVisible(this.hasPublishRequest);

        this.publishButtonForMobile.setLabel(
            i18n('field.publish.item', CompareStatusFormatter.formatStatusTextFromContent(this.content)));
    }

    isOnline(): boolean {
        return !!this.content && this.content.isOnline();
    }

    isPendingDelete(): boolean {
        return !!this.content && this.content.isPendingDelete();
    }

    getPublishButtonForMobile(): ActionButton {
        return this.publishButtonForMobile;
    }

    getPublishButton(): ContentWizardPublishMenuButton {
        return this.publishButton;
    }
}
