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
import {Project} from '../settings/data/project/Project';
import {ProjectUpdatedEvent} from '../settings/event/ProjectUpdatedEvent';
import {ProjectGetRequest} from '../settings/resource/ProjectGetRequest';
import {ProjectViewer} from '../settings/wizard/viewer/ProjectViewer';
import {NonMobileContextPanelToggleButton} from '../view/context/button/NonMobileContextPanelToggleButton';
import {UrlHelper} from '../util/UrlHelper';
import {CONFIG} from 'lib-admin-ui/util/Config';

export interface ContentWizardToolbarConfig {
    actions: ContentWizardActions;
    workflowStateIconsManager: WorkflowStateIconsManager;
}

export class ContentWizardToolbar
    extends ContentStatusToolbar {

    private componentsViewToggler: TogglerButton;

    private cycleViewModeButton: CycleButton;

    private contextPanelToggler: NonMobileContextPanelToggleButton;

    private contentWizardToolbarPublishControls: ContentWizardToolbarPublishControls;

    private stateIcon: DivEl;

    private projectViewer: ProjectViewer;

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
            this.componentsViewToggler.setTitle(isActive ? i18n('field.hideComponent') : i18n('field.showComponent'), false);
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

        ProjectUpdatedEvent.on((event: ProjectUpdatedEvent) => {
            if (event.getProjectName() === ProjectContext.get().getProject().getName()) {
                new ProjectGetRequest(event.getProjectName()).sendAndParse().then((project: Project) => {
                    this.projectViewer.setObject(project);
                }).catch(DefaultErrorHandler.handle);
            }
        });

        this.whenRendered(() => {
            this.projectViewer.getNamesAndIconView().getFirstChild().onClicked(() => this.handleHomeIconClicked());
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
                .setName(ProjectContext.get().getProject().getName())
                .build()
            ]);
            DefaultErrorHandler.handle(reason);
        });
    }

    private addProjectButton(projects: Project[]) {
        const currentProjectName: string = ProjectContext.get().getProject().getName();
        const project: Project = projects.filter((p: Project) => p.getName() === currentProjectName)[0];

        this.projectViewer = new ProjectViewer();
        this.projectViewer.setObject(project);

        this.projectViewer.addClass('project-info');
        this.projectViewer.toggleClass('single-repo', projects.length < 2);

        this.prependChild(this.projectViewer);
    }

    private handleHomeIconClicked() {
        let tabId: string;
        if (navigator.userAgent.search('Chrome') > -1) {
            // add tab id for browsers that can focus tabs by id
            tabId = CONFIG.getString('appId');
        }
        window.open(UrlHelper.createContentBrowseUrl(ProjectContext.get().getProject().getName()), tabId);
    }

    private addActionButtons() {
        const actions: ContentWizardActions = this.config.actions;

        super.addActions([
            actions.getSaveAction(),
            actions.getResetAction(),
            actions.getArchiveAction(),
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
        this.contextPanelToggler = new NonMobileContextPanelToggleButton();

        super.addElement(this.componentsViewToggler);
        super.addElement(this.cycleViewModeButton);
        super.addElement(this.contextPanelToggler);
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

    getContextPanelToggler(): NonMobileContextPanelToggleButton {
        return this.contextPanelToggler;
    }

    getContentWizardToolbarPublishControls() {
        return this.contentWizardToolbarPublishControls;
    }
}
