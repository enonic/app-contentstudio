import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { type AccessControlList } from '../../access/AccessControlList';
import { type Content } from '../../content/Content';
import { type ContentSummaryAndCompareStatus } from '../../content/ContentSummaryAndCompareStatus';
import { Permission } from '../../access/Permission';
import { isOnline, isPublished } from '../../../v6/shared/lib/cms/content/status';
import {
    $wizardActionEnvironment,
    $wizardActionFacts,
    $wizardActions,
    needsUnpublishedChildrenCheck,
    patchWizardActionFacts,
    resetWizardActionFacts,
    setWizardActionsStashed,
    setWizardCanRequestPublish,
    type WizardActionId,
    type WizardActionsState,
} from '../../../v6/pages/wizard/model/wizardActions.store';
import { $wizardHasChanges } from '../../../v6/pages/wizard/model/wizardContent.store';
import { CloseAction } from '@enonic/lib-admin-ui/app/wizard/CloseAction';
import { WizardActions } from '@enonic/lib-admin-ui/app/wizard/WizardActions';
import { type ManagedActionExecutor } from '@enonic/lib-admin-ui/managedaction/ManagedActionExecutor';
import { ManagedActionManager } from '@enonic/lib-admin-ui/managedaction/ManagedActionManager';
import { ManagedActionState } from '@enonic/lib-admin-ui/managedaction/ManagedActionState';
import { type Action } from '@enonic/lib-admin-ui/ui/Action';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import Q from 'q';
import { GetContentByPathRequest } from '../../resource/GetContentByPathRequest';
import { GetContentPermissionsByIdRequest } from '../../resource/GetContentPermissionsByIdRequest';
import { GetContentRootPermissionsRequest } from '../../resource/GetContentRootPermissionsRequest';
import { HasUnpublishedChildrenRequest } from '../../resource/HasUnpublishedChildrenRequest';
import {
    type HasUnpublishedChildren,
    type HasUnpublishedChildrenResult,
} from '../../resource/HasUnpublishedChildrenResult';
import { type ContentWizardPanel } from '../ContentWizardPanel';
import { AccessControlHelper } from '../AccessControlHelper';
import { ProjectHelper } from '../../settings/data/project/ProjectHelper';
import { ArchiveContentAction } from './ArchiveContentAction';
import { ContentSaveAction } from './ContentSaveAction';
import { CreateIssueAction } from './CreateIssueAction';
import { DuplicateContentAction } from './DuplicateContentAction';
import { LocalizeContentAction } from './LocalizeContentAction';
import { MarkAsReadyAction } from './MarkAsReadyAction';
import { MoveContentAction } from './MoveContentAction';
import { OpenRequestAction } from './OpenRequestAction';
import { PreviewAction } from './PreviewAction';
import { PublishAction } from './PublishAction';
import { PublishTreeAction } from './PublishTreeAction';
import { RequestPublishAction } from './RequestPublishAction';
import { ResetContentAction } from './ResetContentAction';
import { SaveAndCloseAction } from './SaveAndCloseAction';
import { ShowFormAction } from './ShowFormAction';
import { ShowLiveEditAction } from './ShowLiveEditAction';
import { UnpublishAction } from './UnpublishAction';

type MirroredActions = Record<WizardActionId, Action>;

//
// The state of the actions lives in `wizardActions.store`. This class writes the facts
// the store derives it from and mirrors the result into the lib-admin-ui `Action` objects
// the toolbar, the shortcuts and the live edit still use.
//
export class ContentWizardActions extends WizardActions<Content> {
    private content: ContentSummaryAndCompareStatus;

    private wizardPanel: ContentWizardPanel;

    private mirroredActions: MirroredActions;

    private saveAction: ContentSaveAction;

    private previewAction: PreviewAction;

    private closeAction: Action;

    private showLiveEditAction: Action;

    private showFormAction: Action;

    private unsubscribers: (() => void)[] = [];

    private beforeActionsStashedListeners: (() => void)[] = [];

    private actionsUnstashedListeners: (() => void)[] = [];

    private parentPermissionRequestId: number = 0;

    private unpublishedChildrenRequestId: number = 0;

    private hasCheckedUnpublishedChildren: boolean = false;

    constructor(wizardPanel: ContentWizardPanel) {
        const contentSaveAction = new ContentSaveAction(wizardPanel);
        const resetContentAction = new ResetContentAction(wizardPanel);
        const archiveContentAction = new ArchiveContentAction(wizardPanel);
        const duplicateContentAction = new DuplicateContentAction(wizardPanel);
        const moveContentAction = new MoveContentAction(wizardPanel);
        const previewAction = new PreviewAction(wizardPanel);
        const publishAction = new PublishAction(wizardPanel);
        const publishTreeAction = new PublishTreeAction(wizardPanel);
        const createIssueAction = new CreateIssueAction(wizardPanel);
        const unpublishAction = new UnpublishAction(wizardPanel).setIconClass('unpublish-action');
        const markAsReadyAction = new MarkAsReadyAction(wizardPanel);
        const requestPublishAction = new RequestPublishAction(wizardPanel);
        const openRequestAction = new OpenRequestAction();
        const closeAction = new CloseAction(wizardPanel);
        const showLiveEditAction = new ShowLiveEditAction(wizardPanel);
        const showFormAction = new ShowFormAction(wizardPanel);
        const saveAndCloseAction = new SaveAndCloseAction(wizardPanel);
        const localizeContentAction = new LocalizeContentAction(wizardPanel);

        super(
            contentSaveAction,
            resetContentAction,
            archiveContentAction,
            duplicateContentAction,
            moveContentAction,
            previewAction,
            publishAction,
            publishTreeAction,
            createIssueAction,
            unpublishAction,
            markAsReadyAction,
            requestPublishAction,
            openRequestAction,
            closeAction,
            showLiveEditAction,
            showFormAction,
            saveAndCloseAction,
            localizeContentAction,
        );

        this.wizardPanel = wizardPanel;
        this.saveAction = contentSaveAction;
        this.previewAction = previewAction;
        this.closeAction = closeAction;
        this.showLiveEditAction = showLiveEditAction;
        this.showFormAction = showFormAction;

        this.mirroredActions = {
            save: contentSaveAction,
            saveAndClose: saveAndCloseAction,
            archive: archiveContentAction,
            duplicate: duplicateContentAction,
            move: moveContentAction,
            publish: publishAction,
            publishTree: publishTreeAction,
            unpublish: unpublishAction,
            markAsReady: markAsReadyAction,
            requestPublish: requestPublishAction,
            openRequest: openRequestAction,
            createIssue: createIssueAction,
            reset: resetContentAction,
            localize: localizeContentAction,
        };

        ManagedActionManager.instance().onManagedActionStateChanged(
            (state: ManagedActionState, _executor: ManagedActionExecutor) => {
                if (state === ManagedActionState.PREPARING) {
                    this.notifyBeforeActionsStashed();
                    setWizardActionsStashed(true);
                } else if (state === ManagedActionState.ENDED) {
                    setWizardActionsStashed(false);
                    this.notifyActionsUnstashed();
                }
            },
        );

        resetWizardActionFacts();
        this.initStoreListeners();
    }

    private initStoreListeners() {
        this.cleanupUnsavedChangesListeners();

        this.unsubscribers = [
            $wizardActions.subscribe((state) => this.mirror(state)),
            $wizardActionFacts.listen(() => this.checkUnpublishedChildren()),
            $wizardActionEnvironment.listen(() => this.checkUnpublishedChildren()),
        ];
    }

    private mirror(state: WizardActionsState): void {
        for (const id of Object.keys(this.mirroredActions) as WizardActionId[]) {
            const action = this.mirroredActions[id];

            action.setEnabled(state[id].enabled);
            action.setVisible(state[id].visible);
        }

        const canSave = $wizardHasChanges.get() || state.save.enabled || !this.saveAction.isSavedStateEnabled();
        this.saveAction.setLabel(i18n(canSave ? 'action.save' : 'action.saved'));
    }

    cleanupUnsavedChangesListeners(): void {
        this.unsubscribers.forEach((unsubscribe) => unsubscribe());
        this.unsubscribers = [];
        this.parentPermissionRequestId++;
        this.unpublishedChildrenRequestId++;
    }

    refreshActions(): Q.Promise<void> {
        if (this.wizardPanel.isNew()) {
            this.enableActionsForNew();
        } else {
            return this.enableActionsForExisting(this.wizardPanel.getPersistedItem());
        }

        return Q();
    }

    enableActionsForNew() {
        patchWizardActionFacts({ persisted: undefined });
        this.previewAction.setWritePermissions(true);
    }

    enableActionsForExisting(existing: Content): Q.Promise<void> {
        const permissions = existing.getPermissions();
        const canModify = AccessControlHelper.hasPermission(Permission.MODIFY, permissions);

        patchWizardActionFacts({
            persisted: {
                unnamed: existing.getName().isUnnamed(),
                deletable: existing.isDeletable(),
                editable: existing.isEditable(),
                dataInherited: existing.isDataInherited(),
                canDelete: AccessControlHelper.hasPermission(Permission.DELETE, permissions),
            },
            canModify,
            canPublish: AccessControlHelper.hasPermission(Permission.PUBLISH, permissions),
        });

        this.previewAction.setWritePermissions(canModify);
        this.checkParentCreatePermission(existing);

        return Q();
    }

    setDeleteOnlyMode(_content: Content, valueOn: boolean = true) {
        patchWizardActionFacts({ deleteOnly: valueOn });
    }

    // Duplicate puts the copy next to the content, so the parent decides.
    private checkParentCreatePermission(existing: Content): void {
        const requestId = ++this.parentPermissionRequestId;

        const request: Q.Promise<AccessControlList> = existing.hasParent()
            ? new GetContentByPathRequest(existing.getPath().getParentPath())
                  .sendAndParse()
                  .then((parent: Content) => new GetContentPermissionsByIdRequest(parent.getContentId()).sendAndParse())
            : new GetContentRootPermissionsRequest().sendAndParse();

        request
            .then((accessControlList: AccessControlList) => {
                if (requestId !== this.parentPermissionRequestId) {
                    return;
                }

                patchWizardActionFacts({
                    parentCanCreate: AccessControlHelper.hasPermission(Permission.CREATE, accessControlList),
                });
            })
            .catch(DefaultErrorHandler.handle);
    }

    setContent(content: ContentSummaryAndCompareStatus): ContentWizardActions {
        this.content = content;
        this.hasCheckedUnpublishedChildren = false;

        const summary = content.getContentSummary();

        patchWizardActionFacts({
            summary: {
                online: isOnline(summary),
                published: isPublished(summary),
                hasChildren: content.hasChildren(),
                inProgress: summary.isInProgress(),
                dataInherited: content.isDataInherited(),
                hasOriginProject: content.hasOriginProject(),
            },
            hasUnpublishedChildren: undefined,
        });

        return this;
    }

    resetUnpublishedChildrenCheck(): ContentWizardActions {
        this.hasCheckedUnpublishedChildren = false;
        return this;
    }

    setUserCanPublish(value: boolean): ContentWizardActions {
        patchWizardActionFacts({ canPublish: value });
        return this;
    }

    setUserCanModify(value: boolean): ContentWizardActions {
        patchWizardActionFacts({ canModify: value });
        return this;
    }

    setHasPublishRequest(value: boolean): ContentWizardActions {
        patchWizardActionFacts({ hasPublishRequest: value });
        return this;
    }

    // The facts that are not stores yet are read again here: the project helper and the place in the parent project.
    refreshState() {
        if (!this.content) {
            return;
        }

        setWizardCanRequestPublish(ProjectHelper.canRequestPublish());
        patchWizardActionFacts({ existsInParentProject: this.wizardPanel.isContentExistsInParentProject() });
        this.checkUnpublishedChildren();
    }

    private checkUnpublishedChildren(): void {
        if (this.hasCheckedUnpublishedChildren || !this.content) {
            return;
        }

        if (!needsUnpublishedChildrenCheck($wizardActionFacts.get(), $wizardActionEnvironment.get())) {
            return;
        }

        this.hasCheckedUnpublishedChildren = true;
        const requestId = ++this.unpublishedChildrenRequestId;

        new HasUnpublishedChildrenRequest([this.content.getContentId()])
            .sendAndParse()
            .then((result: HasUnpublishedChildrenResult) => {
                if (requestId !== this.unpublishedChildrenRequestId) {
                    return;
                }

                patchWizardActionFacts({
                    hasUnpublishedChildren: result
                        .getResult()
                        .some((item: HasUnpublishedChildren) => item.getHasChildren()),
                });
            })
            .catch((err: unknown) => {
                this.hasCheckedUnpublishedChildren = false;
                DefaultErrorHandler.handle(err);
            });
    }

    isOnline(): boolean {
        return !!this.content && isOnline(this.content.getContentSummary());
    }

    onBeforeActionsStashed(listener: () => void) {
        this.beforeActionsStashedListeners.push(listener);
    }

    private notifyBeforeActionsStashed() {
        this.beforeActionsStashedListeners.forEach((listener) => {
            listener();
        });
    }

    onActionsUnstashed(listener: () => void) {
        this.actionsUnstashedListeners.push(listener);
    }

    private notifyActionsUnstashed() {
        this.actionsUnstashedListeners.forEach((listener) => {
            listener();
        });
    }

    getArchiveAction(): Action {
        return this.mirroredActions.archive;
    }

    getResetAction(): Action {
        return this.mirroredActions.reset;
    }

    getLocalizeAction(): Action {
        return this.mirroredActions.localize;
    }

    getSaveAction(): ContentSaveAction {
        return this.saveAction as ContentSaveAction;
    }

    getDuplicateAction(): Action {
        return this.mirroredActions.duplicate;
    }

    getMoveAction(): Action {
        return this.mirroredActions.move;
    }

    getCloseAction(): Action {
        return this.closeAction;
    }

    getPublishAction(): PublishAction {
        return this.mirroredActions.publish as PublishAction;
    }

    getPublishTreeAction(): Action {
        return this.mirroredActions.publishTree;
    }

    getCreateIssueAction(): Action {
        return this.mirroredActions.createIssue;
    }

    getUnpublishAction(): Action {
        return this.mirroredActions.unpublish;
    }

    getMarkAsReadyAction(): Action {
        return this.mirroredActions.markAsReady;
    }

    getRequestPublishAction(): Action {
        return this.mirroredActions.requestPublish;
    }

    getOpenRequestAction(): Action {
        return this.mirroredActions.openRequest;
    }

    getPreviewAction(): Action {
        return this.previewAction;
    }

    getShowLiveEditAction(): Action {
        return this.showLiveEditAction;
    }

    getShowFormAction(): Action {
        return this.showFormAction;
    }
}
