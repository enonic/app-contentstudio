import {ContentWizardActions} from './action/ContentWizardActions';
import {ContentPublishMenuButton} from '../browse/ContentPublishMenuButton';
import {CompareStatusFormatter} from '../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {HasUnpublishedChildren, HasUnpublishedChildrenResult} from '../resource/HasUnpublishedChildrenResult';
import {HasUnpublishedChildrenRequest} from '../resource/HasUnpublishedChildrenRequest';
import Action = api.ui.Action;
import ActionButton = api.ui.button.ActionButton;
import i18n = api.util.i18n;

export class ContentWizardToolbarPublishControls
    extends api.dom.DivEl {

    private publishButton: ContentPublishMenuButton;
    private publishAction: Action;
    private publishTreeAction: Action;
    private createIssueAction: Action;
    private unpublishAction: Action;
    private publishMobileAction: Action;
    private contentCanBePublished: boolean = false;
    private userCanPublish: boolean = true;
    private leafContent: boolean = true;
    private content: ContentSummaryAndCompareStatus;
    private publishButtonForMobile: ActionButton;
    private refreshHandlerDebounced: Function;

    constructor(actions: ContentWizardActions) {
        super('toolbar-publish-controls');

        this.publishAction = actions.getPublishAction();
        this.publishAction.setIconClass('publish-action');
        this.publishTreeAction = actions.getPublishTreeAction();
        this.createIssueAction = actions.getCreateIssueAction();
        this.unpublishAction = actions.getUnpublishAction();
        this.publishMobileAction = actions.getPublishMobileAction();

        this.publishButton = new ContentPublishMenuButton({
            publishAction: this.publishAction,
            publishTreeAction: this.publishTreeAction,
            unpublishAction: this.unpublishAction,
            createIssueAction: this.createIssueAction,
            showCreateIssueButtonByDefault: false
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

    public refreshState() {

        if (!this.content) {
            return;
        }

        this.refreshHandlerDebounced();
    }

    private doRefreshState() {
        const canBePublished = !this.isOnline() && this.contentCanBePublished && this.userCanPublish;
        const canBeUnpublished = this.content.isPublished() && this.userCanPublish;

        this.publishAction.setEnabled(canBePublished);
        this.isPublishTreeEnabled()
            .then((result: boolean) => this.publishTreeAction.setEnabled(result))
            .catch(reason => api.DefaultErrorHandler.handle(reason));
        this.createIssueAction.setEnabled(true);
        this.unpublishAction.setEnabled(canBeUnpublished);
        this.publishMobileAction.setEnabled(canBePublished);
        this.publishMobileAction.setVisible(canBePublished);

        this.publishButtonForMobile.setLabel(
            i18n('field.publish.item', CompareStatusFormatter.formatStatusTextFromContent(this.content)));
    }

    private isPublishTreeEnabled(): wemQ.Promise<boolean> {
        const canTreeBePublished = !this.leafContent && this.contentCanBePublished && this.userCanPublish;

        if (!canTreeBePublished) {
            return wemQ(false);
        }

        /*const resolvePublishDependenciesPromise: wemQ.Promise<ResolvePublishDependenciesResult> =
            ResolvePublishDependenciesRequest.create().setIds([this.content.getContentId()]).build().sendAndParse();*/
        const hasUnpublishedChildrenPromise: wemQ.Promise<HasUnpublishedChildrenResult> =
            new HasUnpublishedChildrenRequest([this.content.getContentId()]).sendAndParse();

        return hasUnpublishedChildrenPromise.then((hasUnpublishedChildrenResult: HasUnpublishedChildrenResult) => {
            const hasUnpublishedChildren: boolean =
                hasUnpublishedChildrenResult.getResult().some((item: HasUnpublishedChildren) => item.getHasChildren());

            return wemQ(hasUnpublishedChildren);
        });
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
