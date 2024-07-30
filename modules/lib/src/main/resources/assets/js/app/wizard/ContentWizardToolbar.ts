import {WebSocketConnection} from '@enonic/lib-admin-ui/connection/WebSocketConnection';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import * as Q from 'q';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentStatusToolbar, ContentStatusToolbarConfig} from '../ContentStatusToolbar';
import {ProjectContext} from '../project/ProjectContext';
import {AI} from '../saga/AI';
import {Project} from '../settings/data/project/Project';
import {ProjectUpdatedEvent} from '../settings/event/ProjectUpdatedEvent';
import {ProjectGetRequest} from '../settings/resource/ProjectGetRequest';
import {ProjectListRequest} from '../settings/resource/ProjectListRequest';
import {ProjectViewer} from '../settings/wizard/viewer/ProjectViewer';
import {UrlHelper} from '../util/UrlHelper';
import {NonMobileContextPanelToggleButton} from '../view/context/button/NonMobileContextPanelToggleButton';
import {ContentWizardActions} from './action/ContentWizardActions';
import {CollaborationEl} from './CollaborationEl';
import {ContentActionCycleButton} from './ContentActionCycleButton';
import {ContentWizardToolbarPublishControls} from './ContentWizardToolbarPublishControls';
import {WorkflowStateManager, WorkflowStateStatus} from './WorkflowStateManager';

export interface ContentWizardToolbarConfig extends ContentStatusToolbarConfig {
    actions: ContentWizardActions;
    workflowStateIconsManager: WorkflowStateManager;
    compareVersionsPreHook?: () => Q.Promise<void>
}

export class ContentWizardToolbar
    extends ContentStatusToolbar {

    protected config: ContentWizardToolbarConfig;

    private cycleViewModeButton: ContentActionCycleButton;

    private contextPanelToggler: NonMobileContextPanelToggleButton;

    private contentWizardToolbarPublishControls: ContentWizardToolbarPublishControls;

    private collaborationBlock?: CollaborationEl;

    private aiAssistantContainer: DivEl;

    private stateIcon?: DivEl;

    private projectViewer: ProjectViewer;

    constructor(config: ContentWizardToolbarConfig) {
        super(config);
    }

    protected initElements(): void {
        super.initElements();

        this.addHomeButton();
        this.addActionButtons();
        this.addPublishMenuButton();
        this.addAIAssistantButton();
        this.addTogglerButtons();

        if (!this.isCollaborationEnabled()) {
            this.addStateIcon();
        }
    }

    protected initListeners(): void {
        super.initListeners();

        this.config.workflowStateIconsManager.onStatusChanged((status: WorkflowStateStatus) => {
            this.updateStateIcon(status);
            this.toggleValid(!WorkflowStateManager.isInvalid(status));
        });

        this.contentWizardToolbarPublishControls.getPublishButton().onInitialized(() => {
            this.status.show();
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

        if (WorkflowStateManager.isReady(status)) {
            this.stateIcon.getEl().setTitle(i18n('tooltip.state.ready'));
        } else if (WorkflowStateManager.isInProgress(status)) {
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
        this.collaborationBlock = new CollaborationEl(this.getItem().getContentId());
        this.addElement(this.collaborationBlock);
        this.openCollaborationWSConnection();
        this.addAssistantIntoCollaborationBlock();
    }

    private addAIAssistantButton(): void {
        if (!AI.get().isAvailable()) {
            return;
        }

        AI.get().whenReady(() => {
            this.aiAssistantContainer = new DivEl('ai-assistant-container');
            this.addElement(this.aiAssistantContainer);

            AI.get().renderAssistant(this.aiAssistantContainer.getHTMLElement(), {
                chatServiceUrl: CONFIG.getString('services.sagaChatServiceUrl'),
                translationServiceUrl: CONFIG.getString('services.sagaTranslationServiceUrl'),
                pollLimit: CONFIG.getNumber('sagaPollLimit'),
                pollDelay: CONFIG.getNumber('sagaPollDelay'),
            });

            this.addAssistantIntoCollaborationBlock();
        });
    }

    private addHomeButton(): void {
        new ProjectListRequest().sendAndParse().then((projects: Project[]) => {
            this.addProjectButton(projects);
        }).catch((reason) => {
            this.addProjectButton([Project.create()
                .setName(ProjectContext.get().getProject().getName())
                .build()
            ]);
            DefaultErrorHandler.handle(reason);
        });
    }

    private addProjectButton(projects: Project[]): void {
        const currentProjectName: string = ProjectContext.get().getProject().getName();
        const project: Project = projects.filter((p: Project) => p.getName() === currentProjectName)[0];

        this.projectViewer = new ProjectViewer();
        this.projectViewer.setObject(project);

        this.projectViewer.addClass('project-info');
        this.projectViewer.toggleClass('single-repo', projects.length < 2);

        this.prependChild(this.projectViewer);
    }

    private handleHomeIconClicked(): void {
        let tabId: string;
        if (navigator.userAgent.search('Chrome') > -1) {
            // add tab id for browsers that can focus tabs by id
            tabId = CONFIG.getString('appId');
        }
        window.open(UrlHelper.createContentBrowseUrl(ProjectContext.get().getProject().getName()), tabId);
    }

    private addActionButtons(): void {
        const actions: ContentWizardActions = this.config.actions;

        super.addActions([
            actions.getSaveAction(),
            actions.getResetAction(),
            actions.getLocalizeAction(),
            actions.getArchiveAction(),
            actions.getDuplicateAction(),
            actions.getMoveAction(),
            actions.getPreviewAction(),
            actions.getUndoPendingDeleteAction()
        ]);
        super.addGreedySpacer();
    }

    private addPublishMenuButton(): void {
        this.status.hide();

        this.contentWizardToolbarPublishControls = new ContentWizardToolbarPublishControls(this.config.actions);
        this.contentWizardToolbarPublishControls.getPublishButton().hide();
        this.addElement(this.contentWizardToolbarPublishControls);
    }

    private addTogglerButtons() {
        const actions: ContentWizardActions = this.config.actions;
        this.cycleViewModeButton = new ContentActionCycleButton([actions.getShowLiveEditAction(), actions.getShowFormAction()]);
        this.contextPanelToggler = new NonMobileContextPanelToggleButton();

        this.addElement(this.cycleViewModeButton);
        this.addElement(this.contextPanelToggler);
    }

    private addStateIcon(): void {
        this.stateIcon = new DivEl('toolbar-state-icon');
        this.addElement(this.stateIcon);
    }

    private isCollaborationEnabled(): boolean {
        return CONFIG.isTrue('enableCollaboration');
    }

    private openCollaborationWSConnection(): void {
        const wsUrl: string =
            UriHelper.joinPath(WebSocketConnection.getWebSocketUriPrefix(), CONFIG.getString('services.collaborationUrl'));

        WebSocketConnection.create()
            .setUrl(`${wsUrl}?contentId=${this.getItem().getId()}&project=${ProjectContext.get().getProject().getName()}`)
            .setKeepAliveTimeSeconds(60)
            .build()
            .connect();
    }

    getCycleViewModeButton(): ContentActionCycleButton {
        return this.cycleViewModeButton;
    }

    getContextPanelToggler(): NonMobileContextPanelToggleButton {
        return this.contextPanelToggler;
    }

    getContentWizardToolbarPublishControls(): ContentWizardToolbarPublishControls {
        return this.contentWizardToolbarPublishControls;
    }

    getStateIcon(): DivEl {
        return this.stateIcon;
    }

    private addAssistantIntoCollaborationBlock(): void {
        if (this.collaborationBlock && this.aiAssistantContainer) {
            this.collaborationBlock.prependChild(this.aiAssistantContainer);
        }
    }

    protected openShowPublishedVersionChangesDialog() {
        const promise = this.config.compareVersionsPreHook || (() => Q.resolve());
        promise().then(() => {
            super.openShowPublishedVersionChangesDialog();
        });
    }
}
