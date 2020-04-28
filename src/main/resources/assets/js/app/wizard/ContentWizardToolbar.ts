import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentWizardActions} from './action/ContentWizardActions';
import {ContentWizardToolbarPublishControls} from './ContentWizardToolbarPublishControls';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {WorkflowStateIconsManager, WorkflowStateStatus} from './WorkflowStateIconsManager';
import {TogglerButton} from 'lib-admin-ui/ui/button/TogglerButton';
import {CycleButton} from 'lib-admin-ui/ui/button/CycleButton';
import {Application} from 'lib-admin-ui/app/Application';
import {ProjectContext} from '../project/ProjectContext';
import {ProjectListRequest} from '../settings/resource/ProjectListRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {NamesAndIconView, NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {NamesAndIconViewSize} from 'lib-admin-ui/app/NamesAndIconViewSize';
import {Project} from '../settings/data/project/Project';
import {ProjectIconUrlResolver} from '../project/ProjectIconUrlResolver';

export interface ContentWizardToolbarConfig {
    application: Application;
    actions: ContentWizardActions;
    workflowStateIconsManager: WorkflowStateIconsManager;
}

export class ContentWizardToolbar
    extends ContentStatusToolbar {

    private componentsViewToggler: TogglerButton;

    private cycleViewModeButton: CycleButton;

    private contentWizardToolbarPublishControls: ContentWizardToolbarPublishControls;

    private mobileItemStatisticsButton: TogglerButton;

    private stateIcon: DivEl;

    private config: ContentWizardToolbarConfig;

    constructor(config: ContentWizardToolbarConfig) {
        super('content-wizard-toolbar');

        this.config = config;
        this.initElements();
        this.initListeners();
    }

    protected initElements() {
        this.addHomeButton();
        this.addActionButtons();
        this.addPublishMenuButton();
        this.addMobileItemStatisticsButton();
        this.addTogglerButtons();

        this.addStateIcon();
    }

    protected initListeners() {
        this.config.workflowStateIconsManager.onStatusChanged((status: WorkflowStateStatus) => {
            if (status.ready) {
                this.stateIcon.getEl().setTitle(i18n('tooltip.state.ready'));
            } else if (status.inProgress) {
                this.stateIcon.getEl().setTitle(i18n('tooltip.state.in_progress'));
            } else {
                this.stateIcon.getEl().removeAttribute('title');
            }

            this.toggleValid(!status.invalid);
        });

        this.componentsViewToggler.onActiveChanged((isActive: boolean) => {
            this.componentsViewToggler.setTitle(isActive ? i18n('field.hideComponent') : i18n('field.showComponent'));
        });

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

    setItem(item: ContentSummaryAndCompareStatus) {
        super.setItem(item);
        this.contentWizardToolbarPublishControls.setContent(item);
    }

    private addHomeButton() {
        new ProjectListRequest().sendAndParse().then((projects: Project[]) => {
            this.addProjectButton(projects);
        }).catch((reason: any) => {
            this.addProjectButton([Project.create()
                .setName(ProjectContext.get().getProject())
                .build()
            ]);
            DefaultErrorHandler.handle(reason);
        });
    }

    private addProjectButton(projects: Project[]) {
        const currentProjectName: string = ProjectContext.get().getProject();
        const project: Project = projects.filter((p: Project) => p.getName() === currentProjectName)[0];

        const projectBlock: NamesAndIconView = new NamesAndIconViewBuilder()
            .setSize(NamesAndIconViewSize.small)
            .build()
            .setMainName(project.getDisplayName())
            .setIconClass('icon-tree-2');

        if (project.getIcon()) {
            projectBlock.setIconUrl(new ProjectIconUrlResolver()
                .setProjectName(project.getName())
                .setTimestamp(new Date().getTime())
                .resolve());
        }

        projectBlock.addClass('project-info');
        projectBlock.toggleClass('single-repo', projects.length < 2);
        projectBlock.getFirstChild().onClicked(() => this.handleHomeIconClicked());

        this.prependChild(projectBlock);
    }

    private handleHomeIconClicked() {
        const application: Application = this.config.application;
        let tabId: string;
        if (navigator.userAgent.search('Chrome') > -1) {
            // add tab id for browsers that can focus tabs by id
            tabId = application.getId();
        }
        window.open(`#/${ProjectContext.get().getProject()}/browse`, tabId);
    }

    private addActionButtons() {
        const actions: ContentWizardActions = this.config.actions;

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

    private addPublishMenuButton() {
        this.status.hide();
        this.author.hide();

        this.contentWizardToolbarPublishControls = new ContentWizardToolbarPublishControls(this.config.actions);
        this.contentWizardToolbarPublishControls.getPublishButton().hide();
        super.addElement(this.contentWizardToolbarPublishControls);
    }

    private addTogglerButtons() {
        const actions: ContentWizardActions = this.config.actions;
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
        this.mobileItemStatisticsButton = new TogglerButton();
        this.mobileItemStatisticsButton.setEnabled(true).addClass('icon-cog details-toggle');
        super.addElement(this.mobileItemStatisticsButton);
    }
}
