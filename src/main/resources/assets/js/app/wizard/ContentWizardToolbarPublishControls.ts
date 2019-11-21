import {ContentWizardActions} from './action/ContentWizardActions';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentWizardPublishMenuButton} from '../browse/ContentWizardPublishMenuButton';
import ActionButton = api.ui.button.ActionButton;
import DivEl = api.dom.DivEl;

export class ContentWizardToolbarPublishControls
    extends api.dom.DivEl {

    private publishButton: ContentWizardPublishMenuButton;

    private mobilePublishControls: DivEl;

    constructor(actions: ContentWizardActions) {
        super('toolbar-publish-controls');

        this.publishButton = new ContentWizardPublishMenuButton({
            publishAction: actions.getPublishAction(),
            unpublishAction: actions.getUnpublishAction(),
            markAsReadyAction: actions.getMarkAsReadyAction(),
            createIssueAction: actions.getCreateIssueAction(),
            requestPublishAction: actions.getRequestPublishAction(),
            openRequestAction: actions.getOpenRequestAction()
        });

        actions.getPublishAction().setIconClass('publish-action');
        this.publishButton.addClass('content-wizard-toolbar-publish-button');

        this.initMobilePublishControls(actions);

        this.initListeners(actions);

        this.appendChild(this.publishButton);
    }

    protected initMobilePublishControls(actions: ContentWizardActions) {
        this.mobilePublishControls = new DivEl('mobile-edit-publish-controls');
        const publishButtonForMobile = this.createPublishButtonForMobile(actions);
        const markAsReadyButtonForMobile = this.createMarkAsReadyButtonForMobile(actions);
        this.mobilePublishControls.appendChildren(publishButtonForMobile, markAsReadyButtonForMobile);
    }

    protected createPublishButtonForMobile(actions: ContentWizardActions): ActionButton {
        const publishButtonForMobile = new ActionButton(actions.getPublishAction());
        publishButtonForMobile.addClass('mobile-edit-publish-button');
        publishButtonForMobile.setVisible(false);

        return publishButtonForMobile;
    }

    protected createMarkAsReadyButtonForMobile(actions: ContentWizardActions): ActionButton {
        const markAsReadyButtonForMobile = new ActionButton(actions.getMarkAsReadyAction());
        markAsReadyButtonForMobile.addClass('mobile-edit-mark-as-ready-button');
        markAsReadyButtonForMobile.setVisible(false);

        return markAsReadyButtonForMobile;
    }

    protected initListeners(actions: ContentWizardActions) {
        const publishAction = actions.getPublishAction();
        const markAsReadyAction = actions.getMarkAsReadyAction();

        const controlsChangedHandler = () => {
            const controlsEnabled = publishAction.isEnabled() || markAsReadyAction.isEnabled();
            this.mobilePublishControls.toggleClass('enabled', controlsEnabled);
        };

        publishAction.onPropertyChanged(controlsChangedHandler);
        markAsReadyAction.onPropertyChanged(() => {
            controlsChangedHandler();
            const markAsReadyEnabled = markAsReadyAction.isEnabled();
            this.mobilePublishControls.toggleClass('mark-as-ready', markAsReadyEnabled);
        });

        actions.onBeforeActionsStashed(() => {
            this.publishButton.setRefreshDisabled(true);
        });

        actions.onActionsUnstashed(() => {
            this.publishButton.setRefreshDisabled(false);
        });
    }

    setContent(content: ContentSummaryAndCompareStatus): ContentWizardToolbarPublishControls {
        this.publishButton.setItem(content);
        return this;
    }

    getMobilePublishControls(): DivEl {
        return this.mobilePublishControls;
    }

    getPublishButton(): ContentWizardPublishMenuButton {
        return this.publishButton;
    }
}
