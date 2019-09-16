import {ContentWizardActions} from './action/ContentWizardActions';
import {ContentWizardToolbarPublishControls} from './ContentWizardToolbarPublishControls';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {WorkflowStateIconsManager, WorkflowStateStatus} from './WorkflowStateIconsManager';
import TogglerButton = api.ui.button.TogglerButton;
import CycleButton = api.ui.button.CycleButton;
import AppIcon = api.app.bar.AppIcon;
import Application = api.app.Application;
import Action = api.ui.Action;
import i18n = api.util.i18n;
import DivEl = api.dom.DivEl;

export interface ContentWizardToolbarConfig {
    application: Application;
    actions: ContentWizardActions;
    workflowStateIconsManager: WorkflowStateIconsManager;
    item?: ContentSummaryAndCompareStatus;
}

export class ContentWizardToolbar
    extends ContentStatusToolbar {

    private componentsViewToggler: TogglerButton;

    private cycleViewModeButton: CycleButton;

    private contentWizardToolbarPublishControls: ContentWizardToolbarPublishControls;

    private mobileItemStatisticsButton: TogglerButton;

    private stateIcon: DivEl;

    private workflowStateIconsManager: WorkflowStateIconsManager;

    constructor(config: ContentWizardToolbarConfig) {
        super('content-wizard-toolbar');

        this.initElements(config);
        this.initListeners();
    }

    protected initElements(config: ContentWizardToolbarConfig) {
        this.workflowStateIconsManager = config.workflowStateIconsManager;

        this.addHomeButton(config.application);
        this.addActionButtons(config.actions);
        this.addPublishMenuButton(config.actions);
        this.addMobileItemStatisticsButton();
        this.addTogglerButtons(config.actions);

        this.addStateIcon();

        if (config.item) {
            if (this.workflowStateIconsManager) {
                const isInProgress = this.workflowStateIconsManager.getStatus().inProgress;
                this.contentWizardToolbarPublishControls.setContentCanBeMarkedAsReady(isInProgress);
            }
            this.setItem(config.item);
        }
    }

    protected initListeners() {
        this.workflowStateIconsManager.onStatusChanged((status: WorkflowStateStatus) => {
            if (status.ready) {
                this.stateIcon.getEl().setTitle(i18n('tooltip.state.ready'));
            } else if (status.inProgress) {
                this.stateIcon.getEl().setTitle(i18n('tooltip.state.in_progress'));
            } else {
                this.stateIcon.getEl().removeAttribute('title');
            }

            this.contentWizardToolbarPublishControls.setContentCanBeMarkedAsReady(status.inProgress, true);
            this.toggleValid(!status.invalid);
        });
    }

    setItem(item: ContentSummaryAndCompareStatus) {
        super.setItem(item);
        this.contentWizardToolbarPublishControls.setContent(item);
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
        this.stateIcon = new DivEl('toolbar-state-icon');
        super.addElement(this.stateIcon);
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

        super.addElement(this.componentsViewToggler);
        super.addElement(this.cycleViewModeButton);
    }

    getStateIcon() {
        return this.stateIcon;
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
