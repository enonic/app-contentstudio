import {ContentWizardActions} from './action/ContentWizardActions';
import {ContentWizardToolbarPublishControls} from './ContentWizardToolbarPublishControls';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import TogglerButton = api.ui.button.TogglerButton;
import CycleButton = api.ui.button.CycleButton;
import AppIcon = api.app.bar.AppIcon;
import Application = api.app.Application;
import Action = api.ui.Action;
import i18n = api.util.i18n;
import DivEl = api.dom.DivEl;

export class ContentWizardToolbar
    extends ContentStatusToolbar {

    private componentsViewToggler: TogglerButton;
    private cycleViewModeButton: CycleButton;
    private contentWizardToolbarPublishControls: ContentWizardToolbarPublishControls;
    private mobileItemStatisticsButton: TogglerButton;
    private stateElement: api.dom.Element;
    private hasUnsavedChanges: boolean;
    private isValid: boolean;
    private skipNextIconStateUpdate: boolean;

    constructor(application: Application, actions: ContentWizardActions, item?: ContentSummaryAndCompareStatus) {
        super('content-wizard-toolbar');

        this.addHomeButton(application);
        this.addActionButtons(actions);
        this.addPublishMenuButton(actions);
        this.addStateIcon();
        this.addTogglerButtons(actions);
        this.addMobileItemStatisticsButton();

        if (item) {
            this.setItem(item);
        }
    }

    setItem(item: ContentSummaryAndCompareStatus) {
        super.setItem(item);

        this.contentWizardToolbarPublishControls.setContent(item);
    }

    setHasUnsavedChanges(value: boolean) {
        this.hasUnsavedChanges = value;
        this.updateStateIconElement();
    }

    setSkipNextIconStateUpdate(skipIconStateUpdate: boolean) {
        this.skipNextIconStateUpdate = skipIconStateUpdate;
    }

    private addHomeButton(application: Application) {
        const homeAction: Action = new Action(application.getName());
        homeAction.onExecuted(() => {
            let tabId;
            if (navigator.userAgent.search('Chrome') > -1) {
                // add tab id for browsers that can focus tabs by id
                tabId = application.getId();
            }
            window.open('#/browse', tabId);     // add browse to prevent tab reload because of url mismatch
            return wemQ(null);
        });

        super.addElement(new AppIcon(application, homeAction));
    }

    private addActionButtons(actions: ContentWizardActions) {
        super.addActions([
            actions.getSaveAction(),
            actions.getDeleteAction(),
            actions.getDuplicateAction(),
            actions.getPreviewAction(),
            actions.getUndoPendingDeleteAction()
        ]);
        super.addGreedySpacer();
    }

    private addStateIcon() {
        this.stateElement = new DivEl('toolbar-state-icon');
        super.addElement(this.stateElement);
    }

    private addPublishMenuButton(actions: ContentWizardActions) {
        this.status.hide();
        this.author.hide();

        this.contentWizardToolbarPublishControls = new ContentWizardToolbarPublishControls(actions);
        this.contentWizardToolbarPublishControls.getPublishButton().hide();
        super.addElement(this.contentWizardToolbarPublishControls);

        this.contentWizardToolbarPublishControls.getPublishButton().onInitialized(() => {
            this.status.show();
            this.author.show();
            this.contentWizardToolbarPublishControls.getPublishButton().show();
            // Call after the ContentPublishMenuButton.handleActionsUpdated debounced calls
            setTimeout(() => this.foldOrExpand());
        });

        this.contentWizardToolbarPublishControls.getPublishButton().onPublishRequestActionChanged((added: boolean) => {
            this.toggleClass('publish-request', added);
        });
    }

    private addTogglerButtons(actions: ContentWizardActions) {
        this.cycleViewModeButton = new CycleButton([actions.getShowLiveEditAction(), actions.getShowFormAction()]);
        this.componentsViewToggler = new TogglerButton('icon-clipboard', i18n('field.showComponent'));

        super.addElement(this.cycleViewModeButton);
        super.addElement(this.componentsViewToggler);
    }

    toggleValid(isValid: boolean) {
        super.toggleValid(isValid);

        this.isValid = isValid;

        if (!this.getItem()) {
            return;
        }

        this.updateStateIconElement();
    }

    private updateStateIconElement() {
        if (this.skipNextIconStateUpdate) {
            this.skipNextIconStateUpdate = false;
            return;
        }

        const isReady: boolean = this.isValid && !this.hasUnsavedChanges && this.isContentReady();
        const isInProgress: boolean = this.isValid && (this.hasUnsavedChanges || this.isContentInProgress());
        this.stateElement.getEl().removeAttribute('title');
        this.stateElement.toggleClass('invalid', !this.isValid);
        this.stateElement.toggleClass('ready', isReady);
        this.stateElement.toggleClass('in-progress', isInProgress);

        if (isReady) {
            this.stateElement.getEl().setTitle(i18n('tooltip.state.ready'));
        } else if (isInProgress) {
            this.stateElement.getEl().setTitle(i18n('tooltip.state.in_progress'));
        }
    }

    private isContentReady(): boolean {
        return !this.getItem().isOnline() && this.getItem().getContentSummary().isReady();
    }

    private isContentInProgress(): boolean {
        return !this.getItem().isOnline() && this.getItem().getContentSummary().isInProgress();
    }

    getCycleViewModeButton(): CycleButton {
        return this.cycleViewModeButton;
    }

    getComponentsViewToggler(): TogglerButton {
        return this.componentsViewToggler;
    }

    getContentWizardToolbarPublishControls() {
        return this.contentWizardToolbarPublishControls;
    }

    getMobileItemStatisticsToggler(): TogglerButton {
        return this.mobileItemStatisticsButton;
    }

    private addMobileItemStatisticsButton() {
        this.mobileItemStatisticsButton = new api.ui.button.TogglerButton();
        this.mobileItemStatisticsButton.setEnabled(true).addClass('icon-cog details-toggle');
        super.addElement(this.mobileItemStatisticsButton);
    }
}
