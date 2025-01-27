import {WebSocketConnection} from '@enonic/lib-admin-ui/connection/WebSocketConnection';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {KeyHelper} from '@enonic/lib-admin-ui/ui/KeyHelper';
import {ToolbarConfig} from '@enonic/lib-admin-ui/ui/toolbar/Toolbar';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import * as Q from 'q';
import {AI} from '../ai/AI';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import {ProjectContext} from '../project/ProjectContext';
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

export interface ContentWizardToolbarConfig extends ToolbarConfig {
    actions: ContentWizardActions;
    workflowStateIconsManager: WorkflowStateManager;
    compareVersionsPreHook?: () => Q.Promise<void>;
}

export class ContentWizardToolbar extends ContentStatusToolbar<ContentWizardToolbarConfig> {
    ariaLabel: string = i18n('wcag.contenteditor.toolbar.label');

    private cycleViewModeButton: ContentActionCycleButton;

    private contextPanelToggler: NonMobileContextPanelToggleButton;

    private contentWizardToolbarPublishControls: ContentWizardToolbarPublishControls;

    private collaborationBlock?: CollaborationEl;

    private aiContentOperatorButtonContainer: DivEl;

    private stateIcon?: DivEl;

    private projectViewer: ProjectViewer;

    private static readonly COLLAB_CHANNEL_NAME = 'content-collab-channel';
    private static readonly MAIN_TAB_CHECK_INTERVAL = 1000;
    private broadcastChannel: BroadcastChannel;
    private isMainTab: boolean = false;
    private mainTabCheckInterval: number;
    private ws: WebSocket;

    constructor(config: ContentWizardToolbarConfig) {
        super(config);
    }

    protected initElements(): void {
        this.addProjectButton();
        this.addActionButtons();
        this.appendStatusWrapperEl();

        if (!this.isCollaborationEnabled()) {
            this.addStateIcon();
        }

        this.addPublishMenuButton();
        this.addEnonicAiContentOperatorButton();
        this.addTogglerButtons();

        this.fetchProjectInfo();
    }

    protected initListeners(): void {
        super.initListeners();

        this.config.workflowStateIconsManager.onStatusChanged((status: WorkflowStateStatus) => {
            this.updateStateIcon(status);
            this.toggleValid(!WorkflowStateManager.isInvalid(status));
        });

        ProjectUpdatedEvent.on((event: ProjectUpdatedEvent) => {
            if (event.getProjectName() === ProjectContext.get().getProject().getName()) {
                new ProjectGetRequest(event.getProjectName())
                    .sendAndParse()
                    .then((project: Project) => {
                        this.projectViewer.setObject(project);
                    })
                    .catch(DefaultErrorHandler.handle);
            }
        });

        this.whenRendered(() => {
            const onPublishControlsInitialised = () => {
                this.status.show();
                this.contentWizardToolbarPublishControls.getPublishButton().show();
                // Call after the ContentPublishMenuButton.handleActionsUpdated debounced calls
                setTimeout(() => this.foldOrExpand());

                if (this.isCollaborationToBeAdded()) {
                    this.addCollaboration();
                }

                this.contentWizardToolbarPublishControls
                    .getPublishButton()
                    .unActionUpdated(onPublishControlsInitialised);
            };

            this.contentWizardToolbarPublishControls.getPublishButton().onActionUpdated(onPublishControlsInitialised);

            this.contentWizardToolbarPublishControls
                .getPublishButton()
                .onPublishRequestActionChanged((added: boolean) => {
                    this.toggleClass('publish-request', added);
                });

            this.projectViewer.onClicked(() => this.handleHomeIconClicked());
            this.projectViewer.onKeyDown((event: KeyboardEvent) => {
                if (KeyHelper.isEnterKey(event)) {
                    this.handleHomeIconClicked();
                }
            });
        });

        window.addEventListener('unload', () => {
            this.cleanup();
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

        this.contentWizardToolbarPublishControls.setContent(item);
    }

    private isCollaborationToBeAdded(): boolean {
        return !this.collaborationBlock && !!this.getItem() && this.isCollaborationEnabled();
    }

    private addCollaboration(): void {
        this.collaborationBlock = new CollaborationEl(this.getItem().getContentId());
        this.addElement(this.collaborationBlock, false);
        this.openCollaborationWSConnection();
        this.addContentOperatorIntoCollaborationBlock();
    }

    private addEnonicAiContentOperatorButton(): void {
        AI.get().whenReady(() => {
            if (AI.get().has('contentOperator')) {
                this.aiContentOperatorButtonContainer = new DivEl('ai-content-operator-button-container');
                this.addElement(this.aiContentOperatorButtonContainer);
                this.addContentOperatorIntoCollaborationBlock();

                const aiContentOperatorDialogContainer = new DivEl('ai-content-operator-dialog-container');
                Body.get().appendChild(aiContentOperatorDialogContainer);

                AI.get().renderContentOperator(
                    this.aiContentOperatorButtonContainer.getHTMLElement(),
                    aiContentOperatorDialogContainer.getHTMLElement(),
                );
            }
        });
    }

    private fetchProjectInfo() {
        new ProjectListRequest()
            .sendAndParse()
            .then((projects: Project[]) => {
                this.initProjectViewer(projects);
                return Q.resolve();
            })
            .catch(reason => {
                this.initProjectViewer([Project.create().setName(ProjectContext.get().getProject().getName()).build()]);
                DefaultErrorHandler.handle(reason);
                return Q.reject(reason);
            });
    }

    private addProjectButton(): void {
        this.projectViewer = new ProjectViewer('project-info');

        this.projectViewer.applyWCAGAttributes({
            ariaLabel: i18n('wcag.projectViewer.openBrowse'),
            ariaHasPopup: '',
        });

        this.addElement(this.projectViewer);
    }

    private initProjectViewer(projects: Project[]): void {
        const currentProjectName: string = ProjectContext.get().getProject().getName();
        const project: Project = projects.filter((p: Project) => p.getName() === currentProjectName)[0];

        this.projectViewer.setObject(project);
        this.projectViewer.toggleClass('single-repo', projects.length < 2);
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
        ]);
        super.addGreedySpacer();
    }

    private addPublishMenuButton(): void {
        this.status.hide();

        this.contentWizardToolbarPublishControls = new ContentWizardToolbarPublishControls(this.config.actions);
        const publishButton = this.contentWizardToolbarPublishControls.getPublishButton();
        publishButton.hide();
        this.addContainer(this.contentWizardToolbarPublishControls, publishButton.getChildControls());
    }

    private addTogglerButtons() {
        const actions: ContentWizardActions = this.config.actions;
        this.cycleViewModeButton = new ContentActionCycleButton([
            actions.getShowLiveEditAction(),
            actions.getShowFormAction(),
        ]);
        this.contextPanelToggler = new NonMobileContextPanelToggleButton();

        this.addElement(this.cycleViewModeButton);
        this.addElement(this.contextPanelToggler);
    }

    private addStateIcon(): void {
        this.stateIcon = new DivEl('toolbar-state-icon');
        this.addElement(this.stateIcon, false);
    }

    private isCollaborationEnabled(): boolean {
        return CONFIG.isTrue('enableCollaboration');
    }

    private openCollaborationWSConnection(): void {
        this.initBroadcastChannel();
        this.checkAndInitMainTab();

        if (!this.isMainTab) {
            this.sendWebSocketMessage({type: 'ping'});
        }
    }

    private createWebSocketUrl(): string {
        const wsUrl: string = UriHelper.joinPath(
            WebSocketConnection.getWebSocketUriPrefix(),
            CONFIG.getString('services.collaborationUrl'),
        );

        const contentId = this.getItem().getId();
        const projectName = ProjectContext.get().getProject().getName();
        return `${wsUrl}?contentId=${contentId}&project=${projectName}`;
    }

    private initBroadcastChannel(): void {
        this.broadcastChannel = new BroadcastChannel(ContentWizardToolbar.COLLAB_CHANNEL_NAME);

        this.broadcastChannel.onmessage = event => {
            if (event.data.type === 'main-tab-check') {
                if (this.isMainTab) {
                    this.broadcastChannel.postMessage({type: 'main-tab-response'});
                }
            } else if (event.data.type === 'main-tab-unload') {
                setTimeout(() => this.checkAndInitMainTab(), 500);
            } else if (event.data.type === 'election-complete') {
                if (!this.isMainTab) {
                    console.log('New main tab elected:', event.data.winner);
                }
            } else if (event.data.type === 'ws-message') {
                const {type, data} = event.data.payload;
                console.log(`[Tab ${this.isMainTab ? 'Main' : 'Secondary'}] WebSocket message:`, {type, data});
            } else if (event.data.type === 'send-ws-message' && this.isMainTab) {
                this.ws?.send(JSON.stringify(event.data.payload));
            }
        };
    }

    private checkAndInitMainTab(): void {
        let mainTabResponseReceived = false;
        let electionInProgress = false;

        // Ask if there's a main tab
        this.broadcastChannel.postMessage({type: 'main-tab-check'});

        // Wait for response
        const electionTimeout = setTimeout(() => {
            if (!mainTabResponseReceived && !electionInProgress) {
                // Start election process
                this.startMainTabElection();
            }
        }, 2000);

        // Listen for main tab response
        const responseHandler = event => {
            if (event.data.type === 'main-tab-response') {
                mainTabResponseReceived = true;
                clearTimeout(electionTimeout);
                this.broadcastChannel.removeEventListener('message', responseHandler);
            } else if (event.data.type === 'election-started') {
                electionInProgress = true;
                clearTimeout(electionTimeout);
            }
        };

        this.broadcastChannel.addEventListener('message', responseHandler);
    }

    private startMainTabElection(): void {
        const electionId = Math.random().toString(36).substring(2, 15);
        let hasHigherPriorityTab = false;

        // Announce election start
        this.broadcastChannel.postMessage({
            type: 'election-started',
            electionId,
            priority: electionId,
        });

        // Wait for other tabs to respond
        const electionHandler = event => {
            if (event.data.type === 'election-started' && event.data.electionId !== electionId) {
                // Compare priorities - higher value wins
                if (event.data.priority > electionId) {
                    hasHigherPriorityTab = true;
                }
            } else if (event.data.type === 'main-tab-response') {
                // If we get a main tab response during election, abort
                hasHigherPriorityTab = true;
                this.broadcastChannel.removeEventListener('message', electionHandler);
            }
        };

        this.broadcastChannel.addEventListener('message', electionHandler);

        // After election period, become main tab if we have the highest priority
        setTimeout(() => {
            this.broadcastChannel.removeEventListener('message', electionHandler);
            if (!hasHigherPriorityTab) {
                this.becomeMainTab();
                // Announce the election result
                this.broadcastChannel.postMessage({
                    type: 'election-complete',
                    winner: electionId,
                });
            }
        }, 1000);
    }

    private becomeMainTab(): void {
        this.isMainTab = true;
        this.createWebSocketConnection(this.createWebSocketUrl());

        this.mainTabCheckInterval = window.setInterval(() => {
            this.broadcastChannel.postMessage({type: 'main-tab-response'});
        }, ContentWizardToolbar.MAIN_TAB_CHECK_INTERVAL);
    }

    private createWebSocketConnection(url: string): void {
        this.ws = new WebSocket(url, []);

        this.ws.onopen = () => {
            console.log('WebSocket connection opened.');
            this.broadcastChannel.postMessage({
                type: 'ws-message',
                payload: {type: 'connection', data: 'WebSocket connection opened'},
            });
        };

        this.ws.onmessage = event => {
            // Broadcast the message to all tabs
            this.broadcastChannel.postMessage({
                type: 'ws-message',
                payload: event.data,
            });
        };

        this.ws.onclose = () => {
            console.log('WebSocket connection closed.');
            if (this.isMainTab) {
                // Try to reconnect if we're the main tab
                setTimeout(() => this.createWebSocketConnection(url), 5000);
            }
        };

        this.ws.onerror = error => {
            console.error('WebSocket error:', error);
        };
    }

    private cleanup(): void {
        if (this.mainTabCheckInterval) {
            clearInterval(this.mainTabCheckInterval);
        }

        if (this.isMainTab) {
            // Notify other tabs that main tab is unloading
            this.broadcastChannel.postMessage({type: 'main-tab-unload'});
        }

        if (this.ws) {
            this.ws.close();
        }

        this.isMainTab = false;

        if (this.broadcastChannel) {
            this.broadcastChannel.close();
        }
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

    private addContentOperatorIntoCollaborationBlock(): void {
        if (this.collaborationBlock && this.aiContentOperatorButtonContainer) {
            this.collaborationBlock.prependChild(this.aiContentOperatorButtonContainer);
        }
    }

    protected openShowPublishedVersionChangesDialog() {
        const promise = this.config.compareVersionsPreHook || (() => Q.resolve());
        promise().then(() => {
            super.openShowPublishedVersionChangesDialog();
        });
    }

    private sendWebSocketMessage(message: Record<string, unknown>): void {
        if (!this.isMainTab) {
            this.broadcastChannel.postMessage({
                type: 'send-ws-message',
                payload: message,
            });
        } else if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
}
