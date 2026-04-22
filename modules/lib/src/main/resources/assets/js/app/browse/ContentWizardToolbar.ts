import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {type ToolbarConfig} from '@enonic/lib-admin-ui/ui/toolbar/Toolbar';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import Q from 'q';
import {AI} from '../ai/AI';
import {ContentUnnamed} from '../content/ContentUnnamed';
import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ProjectContext} from '../project/ProjectContext';
import {GetPrincipalsByKeysRequest} from '../security/GetPrincipalsByKeysRequest';
import {Project} from '../settings/data/project/Project';
import {ProjectUpdatedEvent} from '../settings/event/ProjectUpdatedEvent';
import {ProjectGetRequest} from '../settings/resource/ProjectGetRequest';
import {ProjectListRequest} from '../settings/resource/ProjectListRequest';
import {subscribe as subscribeToCollaborators} from '../stores/collaboration';
import {UrlHelper} from '../util/UrlHelper';
import {type ContentWizardActions} from '../wizard/action/ContentWizardActions';
import {ContentWizardToolbarPublishControls} from '../wizard/ContentWizardToolbarPublishControls';
import {PublishStatus} from '../publish/PublishStatus';
import {
    $wizardToolbar,
    setWizardToolbarCanRenameContentPath,
    resetWizardToolbar,
    setWizardToolbarContentPath,
    setWizardToolbarCollaborators,
    setWizardToolbarIsContentOnline,
    setWizardToolbarIsLayerProject,
    setWizardToolbarProjectInfo,
    setWizardToolbarProjectLabel,
    setWizardToolbarPublishStatus,
} from '../../v6/features/store/wizardToolbar.store';
import {$wizardDraftName} from '../../v6/features/store/wizardContent.store';
import type {WizardToolbarCollaborator} from '../../v6/features/store/wizardToolbar.types';
import {calcTreePublishStatus} from '../../v6/features/utils/cms/content/status';
import {
    ContentWizardToolbarElement as V6ContentWizardToolbarElement
} from '../../v6/features/views/browse/toolbar/ContentWizardToolbar';

export type ContentWizardToolbarConfig = ToolbarConfig & {
    actions: ContentWizardActions;
    compareVersionsPreHook?: () => Q.Promise<void>;
    onContentPathClick?: () => void;
};

class ContentWizardToolbarElement extends V6ContentWizardToolbarElement {

    ariaLabel: string = i18n('wcag.contenteditor.toolbar.label');

    private readonly config: ContentWizardToolbarConfig;

    private item: ContentSummaryAndCompareStatus;

    private contentWizardToolbarPublishControls: ContentWizardToolbarPublishControls;

    private hiddenElementsHost?: DivEl;

    private aiContentOperatorButtonContainer: DivEl;

    private stateIcon?: DivEl;

    private readonly currentUser = AuthContext.get().getUser();

    private readonly currentUserKey = this.currentUser?.getKey().toString();

    private readonly collaboratorDisplayNames = new Map<string, string>();

    private unsubscribeFromCollaborators?: () => void;

    private collaborationContentId?: string;

    private collaborationRequestId: number = 0;

    constructor(config: ContentWizardToolbarConfig) {
        const actions: ContentWizardActions = config.actions;

        super({
            onProjectBack: () => {
                this.handleProjectBackClicked();
            },
            onLayersClick: () => {
                this.handleLayersClicked();
            },
            onContentPathClick: () => {
                this.handleContentPathClicked();
            },
            saveAction: actions.getSaveAction(),
            resetAction: actions.getResetAction(),
            localizeAction: actions.getLocalizeAction(),
            archiveAction: actions.getArchiveAction(),
            duplicateAction: actions.getDuplicateAction(),
            moveAction: actions.getMoveAction(),
            previewAction: actions.getPreviewAction(),
            markAsReadyAction: actions.getMarkAsReadyAction(),
            publishAction: actions.getPublishAction(),
            unpublishAction: actions.getUnpublishAction(),
            requestPublishAction: actions.getRequestPublishAction(),
            openRequestAction: actions.getOpenRequestAction(),
            createIssueAction: actions.getCreateIssueAction(),
        });

        this.config = config;
        this.getHTMLElement().classList.remove('contents');

        if (this.currentUserKey) {
            this.collaboratorDisplayNames.set(this.currentUserKey, this.currentUser.getDisplayName());
        }

        this.initElements();
        this.initListeners();
    }

    private initElements(): void {
        resetWizardToolbar();
        const currentProject = ProjectContext.get().getProject();
        setWizardToolbarIsLayerProject(currentProject.hasParents());
        setWizardToolbarProjectInfo(currentProject.getName(), currentProject.getLanguage() || '', !!currentProject.getIcon());

        this.addHiddenElementsHost();

        if (!this.isCollaborationEnabled()) {
            this.addStateIcon();
        }

        this.addHiddenPublishControls();
        this.addEnonicAiContentOperatorButton();

        this.fetchProjectInfo();

        if (this.isCollaborationEnabled() && this.getItem()) {
            this.subscribeToCollaboration(this.getItem().getContentId().toString());
        }
    }

    private initListeners(): void {
        ProjectUpdatedEvent.on((event: ProjectUpdatedEvent) => {
            if (event.getProjectName() === ProjectContext.get().getProject().getName()) {
                new ProjectGetRequest(event.getProjectName()).sendAndParse().then((project: Project) => {
                    this.updateProjectLabel(project);
                }).catch(DefaultErrorHandler.handle);
            }
        });

        this.whenRendered(() => {
            const onPublishControlsInitialised = () => {
                this.contentWizardToolbarPublishControls.getPublishButton().show();
                this.contentWizardToolbarPublishControls.getPublishButton().unActionUpdated(onPublishControlsInitialised);
            };

            this.contentWizardToolbarPublishControls.getPublishButton().onActionUpdated(onPublishControlsInitialised);

            this.contentWizardToolbarPublishControls.getPublishButton().onPublishRequestActionChanged((added: boolean) => {
                this.toggleClass('publish-request', added);
            });
        });

        this.onRemoved(() => {
            this.unsubscribeFromCollaboration();
            this.hiddenElementsHost?.remove();
            this.hiddenElementsHost = undefined;
            resetWizardToolbar();
        });
    }

    setItem(item: ContentSummaryAndCompareStatus): void {
        this.item = item;
        const publishStatus = this.resolveToolbarPublishStatus(item);
        const contentPath = this.resolveToolbarContentPath(item);
        setWizardToolbarPublishStatus(publishStatus);
        setWizardToolbarContentPath(contentPath);
        setWizardToolbarCanRenameContentPath(!!item?.getPath());
        setWizardToolbarIsContentOnline(this.isOnline(publishStatus));
        this.contentWizardToolbarPublishControls.setContent(item);

        if (this.isCollaborationEnabled()) {
            this.subscribeToCollaboration(item.getContentId().toString());
        }
    }

    getItem(): ContentSummaryAndCompareStatus {
        return this.item;
    }

    private addHiddenElementsHost(): void {
        this.hiddenElementsHost = new DivEl('content-wizard-toolbar-hidden-elements');
        this.hiddenElementsHost.hide();
        Body.get().appendChild(this.hiddenElementsHost);
    }

    private subscribeToCollaboration(contentId: string): void {
        if (this.collaborationContentId === contentId) {
            return;
        }

        this.unsubscribeFromCollaboration();
        this.collaborationContentId = contentId;

        this.unsubscribeFromCollaborators = subscribeToCollaborators(
            contentId,
            ProjectContext.get().getProject().getName(),
            (collaborators: Set<string>) => this.handleCollaboratorsUpdated(collaborators)
        );
    }

    private unsubscribeFromCollaboration(): void {
        this.unsubscribeFromCollaborators?.();
        this.unsubscribeFromCollaborators = undefined;
        this.collaborationContentId = undefined;
        this.collaborationRequestId += 1;
        setWizardToolbarCollaborators([]);
    }

    private handleCollaboratorsUpdated(collaborators: Set<string>): void {
        const collaboratorKeys = this.sortCollaboratorKeys(Array.from(collaborators));
        const requestId = ++this.collaborationRequestId;
        const missingCollaborators = collaboratorKeys
            .filter((key: string) => !this.collaboratorDisplayNames.has(key))
            .map((key: string) => PrincipalKey.fromString(key));

        if (missingCollaborators.length === 0) {
            this.updateCollaborators(collaboratorKeys, requestId);
            return;
        }

        new GetPrincipalsByKeysRequest(missingCollaborators).sendAndParse()
            .then((principals: Principal[]) => {
                principals.forEach((principal: Principal) => {
                    this.collaboratorDisplayNames.set(principal.getKey().toString(), principal.getDisplayName());
                });
            })
            .catch(DefaultErrorHandler.handle)
            .then(() => {
                this.updateCollaborators(collaboratorKeys, requestId);
            });
    }

    private updateCollaborators(collaboratorKeys: string[], requestId: number): void {
        if (requestId !== this.collaborationRequestId) {
            return;
        }

        const collaborators: WizardToolbarCollaborator[] = collaboratorKeys.map((key: string) => ({
            key,
            label: this.collaboratorDisplayNames.get(key) || key,
            isCurrent: this.currentUserKey === key,
        }));

        setWizardToolbarCollaborators(collaborators);
    }

    private sortCollaboratorKeys(collaboratorKeys: string[]): string[] {
        if (!this.currentUserKey) {
            return collaboratorKeys;
        }

        return [...collaboratorKeys].sort((a: string, b: string) => {
            if (a === this.currentUserKey) {
                return -1;
            }

            if (b === this.currentUserKey) {
                return 1;
            }

            return 0;
        });
    }

    private resolveToolbarPublishStatus(item: ContentSummaryAndCompareStatus): PublishStatus | null {
        const publishStatus = item?.getPublishStatus();
        if (publishStatus != null) {
            return publishStatus;
        }

        const summary = item?.getContentSummary();
        if (summary != null) {
            return calcTreePublishStatus(summary);
        }

        return $wizardToolbar.get().publishStatus ?? null;
    }

    private isOnline(publishStatus: PublishStatus | null): boolean {
        return publishStatus != null && publishStatus !== PublishStatus.OFFLINE;
    }

    private resolveToolbarContentPath(item: ContentSummaryAndCompareStatus): string {
        const draftName = $wizardDraftName.get()?.toString() || '';
        if (draftName.length > 0) {
            return draftName;
        }

        const summaryName = item?.getContentSummary()?.getName()?.toString() || '';
        if (summaryName.length > 0) {
            return summaryName.startsWith(ContentUnnamed.UNNAMED_PREFIX) ? '' : summaryName;
        }

        const pathName = item?.getPath()?.getName() || '';
        return pathName.startsWith(ContentUnnamed.UNNAMED_PREFIX) ? '' : pathName;
    }

    private addEnonicAiContentOperatorButton(): void {
        AI.get().whenReady(() => {
            if (!this.hiddenElementsHost || !AI.get().has('contentOperator')) {
                return;
            }

            this.aiContentOperatorButtonContainer = new DivEl('ai-content-operator-button-container');
            this.hiddenElementsHost.appendChild(this.aiContentOperatorButtonContainer);

            const aiContentOperatorDialogContainer = new DivEl('ai-content-operator-dialog-container');
            Body.get().appendChild(aiContentOperatorDialogContainer);

            AI.get().renderContentOperator(
                this.aiContentOperatorButtonContainer.getHTMLElement(),
                aiContentOperatorDialogContainer.getHTMLElement()
            );
        });
    }

    private fetchProjectInfo(): void {
        new ProjectListRequest().sendAndParse().then((projects: Project[]) => {
            this.updateProjectLabelByName(projects, ProjectContext.get().getProject().getName());
        }).catch((reason) => {
            this.updateProjectLabel(Project.create().setName(ProjectContext.get().getProject().getName()).build());
            DefaultErrorHandler.handle(reason);
            return Q.reject(reason);
        });
    }

    private updateProjectLabelByName(projects: Project[], projectName: string): void {
        const project = projects.find((candidate: Project) => candidate.getName() === projectName);
        if (project) {
            this.updateProjectLabel(project);
            return;
        }

        this.updateProjectLabel(Project.create().setName(projectName).build());
    }

    private updateProjectLabel(project: Project): void {
        const displayName = project.getDisplayName() || project.getName();
        const language = project.getLanguage() ? ` (${project.getLanguage()})` : '';
        setWizardToolbarProjectLabel(`${displayName}${language}`);
        setWizardToolbarProjectInfo(project.getName(), project.getLanguage() || '', !!project.getIcon());
        setWizardToolbarIsLayerProject(project.hasParents());
    }

    private handleProjectBackClicked(): void {
        window.location.href = UrlHelper.createContentBrowseUrl(ProjectContext.get().getProject().getName());
    }

    private handleContentPathClicked(): void {
        if (!$wizardToolbar.get().canRenameContentPath) {
            return;
        }

        this.config.onContentPathClick?.();
    }

    private handleLayersClicked(): void {
        // Layers widget integration is pending. Keep icon visible and this as a safe no-op.
    }

    private addHiddenPublishControls(): void {
        this.contentWizardToolbarPublishControls = new ContentWizardToolbarPublishControls(this.config.actions);
        this.contentWizardToolbarPublishControls.hide();

        const publishButton = this.contentWizardToolbarPublishControls.getPublishButton();
        publishButton.hide();

        this.hiddenElementsHost?.appendChild(this.contentWizardToolbarPublishControls);
    }

    private addStateIcon(): void {
        this.stateIcon = new DivEl('toolbar-state-icon');
        this.hiddenElementsHost?.appendChild(this.stateIcon);
    }

    private isCollaborationEnabled(): boolean {
        return CONFIG.isTrue('enableCollaboration');
    }

    getContentWizardToolbarPublishControls(): ContentWizardToolbarPublishControls {
        return this.contentWizardToolbarPublishControls;
    }

    getStateIcon(): DivEl {
        return this.stateIcon;
    }
}

export {ContentWizardToolbarElement as ContentWizardToolbar};
