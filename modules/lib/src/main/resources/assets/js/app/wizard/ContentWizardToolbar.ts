import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentWizardActions} from './action/ContentWizardActions';
import {ContentWizardToolbarPublishControls} from './ContentWizardToolbarPublishControls';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {WorkflowStateIconsManager, WorkflowStateStatus} from './WorkflowStateIconsManager';
import {TogglerButton} from 'lib-admin-ui/ui/button/TogglerButton';
import {CycleButton} from 'lib-admin-ui/ui/button/CycleButton';
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
import {CollaborationEl} from './CollaborationEl';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import {WebSocketConnection} from 'lib-admin-ui/connection/WebSocketConnection';

export interface ContentWizardToolbarConfig {
    actions: ContentWizardActions;
    workflowStateIconsManager: WorkflowStateIconsManager
}

export class ContentWizardToolbar
    extends ContentStatusToolbar {

    private componentsViewToggler: TogglerButton;

    private cycleViewModeButton: CycleButton;

    private contextPanelToggler: NonMobileContextPanelToggleButton;

    private contentWizardToolbarPublishControls: ContentWizardToolbarPublishControls;

    private collaborationBlock?: DivEl;

    private stateIcon?: DivEl;

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

        if (!this.isCollaborationEnabled()) {
            this.addStateIcon();
        }
    }

    protected initListeners() {
        this.config.workflowStateIconsManager.onStatusChanged((status: WorkflowStateStatus) => {
            this.updateStateIcon(status);
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

    private updateStateIcon(status: WorkflowStateStatus): void {
        if (!this.stateIcon) {
            return;
        }

        if (status.ready) {
            this.stateIcon.getEl().setTitle(i18n('tooltip.state.ready'));
        } else if (status.inProgress) {
            this.stateIcon.getEl().setTitle(i18n('tooltip.state.in_progress'));
        } else {
            this.stateIcon.getEl().removeAttribute('title');
        }
    }

    setItem(item: ContentSummaryAndCompareStatus): void {
        super.setItem(item);

        if (this.isCollaborationToBeAdded()) {
            this.addCollaboration();
        }

        this.contentWizardToolbarPublishControls.setContent(item);
    }

    private isCollaborationToBeAdded(): boolean {
        return !this.collaborationBlock && !!this.getItem() && this.isCollaborationEnabled();
    }

    private addCollaboration(): void {
        this.collaborationBlock = new CollaborationEl();
        super.addElement(this.collaborationBlock);
        this.openCollaborationWSConnection();
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

    private addStateIcon(): void {
        this.stateIcon = new DivEl('toolbar-state-icon');
        super.addElement(this.stateIcon);
    }

    private isCollaborationEnabled(): boolean {
        return CONFIG.isTrue('enableCollaboration');
    }

    private openCollaborationWSConnection(): void {
        const wsUrl: string =
            UriHelper.joinPath(WebSocketConnection.getWebSocketUriPrefix(), CONFIG.getString('services.collaborationUrl'));

        WebSocketConnection.create()
            .setUrl(`${wsUrl}?contentId=${this.getItem().getId()}`)
            .setKeepAliveTimeSeconds(60)
            .build()
            .connect();
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

    getStateIcon(): DivEl {
        return this.stateIcon;
    }
}
