import '../../api.ts';
import {ContentWizardActions} from './action/ContentWizardActions';

import Action = api.ui.Action;
import SpanEl = api.dom.SpanEl;
import MenuButton = api.ui.button.MenuButton;
import ActionButton = api.ui.button.ActionButton;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import i18n = api.util.i18n;

export class ContentWizardToolbarPublishControls
    extends api.dom.DivEl {

    private publishButton: MenuButton;
    private publishAction: Action;
    private publishTreeAction: Action;
    private createIssueAction: Action;
    private unpublishAction: Action;
    private publishMobileAction: Action;
    private contentStateSpan: SpanEl;
    private contentCanBePublished: boolean = false;
    private userCanPublish: boolean = true;
    private leafContent: boolean = true;
    private content: ContentSummaryAndCompareStatus;
    private publishButtonForMobile: ActionButton;

    constructor(actions: ContentWizardActions) {
        super('toolbar-publish-controls');

        this.publishAction = actions.getPublishAction();
        this.publishAction.setIconClass('publish-action');
        this.publishTreeAction = actions.getPublishTreeAction();
        this.createIssueAction = actions.getCreateIssueAction();
        this.unpublishAction = actions.getUnpublishAction();
        this.publishMobileAction = actions.getPublishMobileAction();

        this.publishButton = new MenuButton(this.publishAction, [this.publishTreeAction, this.unpublishAction, this.createIssueAction]);
        this.publishButton.addClass('content-wizard-toolbar-publish-button');

        this.contentStateSpan = new SpanEl('content-status');

        this.publishButtonForMobile = new ActionButton(this.publishMobileAction);
        this.publishButtonForMobile.addClass('mobile-edit-publish-button');
        this.publishButtonForMobile.setVisible(false);

        this.appendChildren(this.contentStateSpan, this.publishButton);
    }

    public setContent(content: ContentSummaryAndCompareStatus, refresh: boolean = true): ContentWizardToolbarPublishControls {
        this.content = content;
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

    private refreshState() {

        if (!this.content) {
            return;
        }

        let canBePublished = !this.isOnline() && this.contentCanBePublished && this.userCanPublish;
        let canTreeBePublished = !this.leafContent && this.contentCanBePublished && this.userCanPublish;
        let canBeUnpublished = this.content.isPublished() && this.userCanPublish;

        this.publishAction.setEnabled(canBePublished);
        this.publishTreeAction.setEnabled(canTreeBePublished);
        this.createIssueAction.setEnabled(true);
        this.unpublishAction.setEnabled(canBeUnpublished);
        this.publishMobileAction.setEnabled(canBePublished);
        this.publishMobileAction.setVisible(canBePublished);

        this.contentStateSpan.setHtml(this.getContentStateValueForSpan(this.content), false);
        this.publishButtonForMobile.setLabel(
            i18n('field.publish.item', api.content.CompareStatusFormatter.formatStatusTextFromContent(this.content)));
    }

    public isOnline(): boolean {
        return !!this.content && this.content.isOnline();
    }

    public isPendingDelete(): boolean {
        return !!this.content && this.content.isPendingDelete();
    }

    public enableActionsForExisting(existing: api.content.Content) {
        new api.security.auth.IsAuthenticatedRequest().sendAndParse().then((loginResult: api.security.auth.LoginResult) => {
            let hasPublishPermission = api.security.acl.PermissionHelper.hasPermission(api.security.acl.Permission.PUBLISH,
                loginResult, existing.getPermissions());
            this.setUserCanPublish(hasPublishPermission);
        });
    }

    private getContentStateValueForSpan(content: ContentSummaryAndCompareStatus): string {

        let status = new api.dom.SpanEl();
        if (this.isOnline()) {
            status.addClass('online');
        }

        status.addClass(content.getStatusClass());
        status.setHtml(content.getStatusText());

        return i18n('field.publish.status', status.toString());
    }

    public getPublishButtonForMobile(): ActionButton {
        return this.publishButtonForMobile;
    }
}
