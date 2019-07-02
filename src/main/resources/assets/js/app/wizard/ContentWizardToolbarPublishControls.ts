import {ContentWizardActions} from './action/ContentWizardActions';
import {ContentPublishMenuButton} from '../browse/ContentPublishMenuButton';
import {CompareStatusFormatter} from '../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import Action = api.ui.Action;
import ActionButton = api.ui.button.ActionButton;
import i18n = api.util.i18n;

export class ContentWizardToolbarPublishControls
    extends api.dom.DivEl {

    private publishButton: ContentPublishMenuButton;
    private publishAction: Action;
    private createIssueAction: Action;
    private unpublishAction: Action;
    private publishMobileAction: Action;
    private markAsReadyAction: Action;
    private requestPublishAction: Action;
    private contentCanBePublished: boolean = false;
    private userCanPublish: boolean = true;
    private leafContent: boolean = true;
    private isContentValid: boolean = false;
    private content: ContentSummaryAndCompareStatus;
    private publishButtonForMobile: ActionButton;
    private refreshHandlerDebounced: Function;

    constructor(actions: ContentWizardActions) {
        super('toolbar-publish-controls');

        this.publishAction = actions.getPublishAction();
        this.publishAction.setIconClass('publish-action');
        this.createIssueAction = actions.getCreateIssueAction();
        this.unpublishAction = actions.getUnpublishAction();
        this.publishMobileAction = actions.getPublishMobileAction();
        this.markAsReadyAction = actions.getMarkAsReadyAction();
        this.requestPublishAction = actions.getRequestPublishAction();

        this.publishButton = new ContentPublishMenuButton({
            publishAction: this.publishAction,
            unpublishAction: this.unpublishAction,
            markAsReadyAction: this.markAsReadyAction,
            createIssueAction: this.createIssueAction,
            requestPublishAction: this.requestPublishAction
        });
        this.publishButton.addClass('content-wizard-toolbar-publish-button');

        this.publishButtonForMobile = new ActionButton(this.publishMobileAction);
        this.publishButtonForMobile.addClass('mobile-edit-publish-button');
        this.publishButtonForMobile.setVisible(false);

        this.refreshHandlerDebounced = api.util.AppHelper.debounce(this.doRefreshState.bind(this), 200);

        this.appendChild(this.publishButton);
    }

    public setContent(content: ContentSummaryAndCompareStatus, refresh: boolean = true): ContentWizardToolbarPublishControls {
        this.content = content;
        this.publishButton.setItem(content);
        if (refresh) {
            this.refreshState();
        }
        return this;
    }

    public setContentCanBePublished(value: boolean, refresh: boolean = true): ContentWizardToolbarPublishControls {
        this.contentCanBePublished = value;
        if (refresh) {
            this.refreshState();
        }
        return this;
    }

    public setUserCanPublish(value: boolean, refresh: boolean = true): ContentWizardToolbarPublishControls {
        this.userCanPublish = value;
        if (refresh) {
            this.refreshState();
        }
        return this;
    }

    public setLeafContent(leafContent: boolean, refresh: boolean = true): ContentWizardToolbarPublishControls {
        this.leafContent = leafContent;
        if (refresh) {
            this.refreshState();
        }
        return this;
    }

    public setIsValid(value: boolean): ContentWizardToolbarPublishControls {
        const isRefreshNeeded: boolean = value !== this.isContentValid;
        this.isContentValid = value;
        if (isRefreshNeeded) {
            this.refreshState();
        }
        return this;
    }

    public refreshState() {

        if (!this.content) {
            return;
        }

        this.refreshHandlerDebounced();
    }

    private doRefreshState() {
        const canBePublished: boolean = !this.isOnline() && this.contentCanBePublished && this.userCanPublish;
        const canBeUnpublished: boolean = this.content.isPublished() && this.userCanPublish;
        const canBeMarkedAsReady: boolean = this.isContentValid && !this.content.isOnline() && !this.content.getContentSummary().isReady();
        const canBeRequestedPublish: boolean = this.isContentValid && !this.content.isOnline() &&
                                               !this.content.getContentSummary().isInProgress();

        this.publishAction.setEnabled(canBePublished);
        this.createIssueAction.setEnabled(true);
        this.unpublishAction.setEnabled(canBeUnpublished);
        this.publishMobileAction.setEnabled(canBePublished);
        this.publishMobileAction.setVisible(canBePublished);
        this.markAsReadyAction.setEnabled(canBeMarkedAsReady);
        this.requestPublishAction.setEnabled(canBeRequestedPublish);

        this.publishButtonForMobile.setLabel(
            i18n('field.publish.item', CompareStatusFormatter.formatStatusTextFromContent(this.content)));
    }

    public isOnline(): boolean {
        return !!this.content && this.content.isOnline();
    }

    public isPendingDelete(): boolean {
        return !!this.content && this.content.isPendingDelete();
    }

    public getPublishButtonForMobile(): ActionButton {
        return this.publishButtonForMobile;
    }

    public getPublishButton(): ContentPublishMenuButton {
        return this.publishButton;
    }
}
