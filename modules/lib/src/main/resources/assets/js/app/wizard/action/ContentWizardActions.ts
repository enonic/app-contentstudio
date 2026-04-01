import {type AccessControlList} from '../../access/AccessControlList';
import {type Content} from '../../content/Content';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {Permission} from '../../access/Permission';
import {CloseAction} from '@enonic/lib-admin-ui/app/wizard/CloseAction';
import {WizardActions} from '@enonic/lib-admin-ui/app/wizard/WizardActions';
import {type ManagedActionExecutor} from '@enonic/lib-admin-ui/managedaction/ManagedActionExecutor';
import {ManagedActionManager} from '@enonic/lib-admin-ui/managedaction/ManagedActionManager';
import {ManagedActionState} from '@enonic/lib-admin-ui/managedaction/ManagedActionState';
import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {type ActionsMap, type ActionsState, ActionsStateManager} from '@enonic/lib-admin-ui/ui/ActionsStateManager';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import Q from 'q';
import {GetContentByPathRequest} from '../../resource/GetContentByPathRequest';
import {GetContentPermissionsByIdRequest} from '../../resource/GetContentPermissionsByIdRequest';
import {GetContentRootPermissionsRequest} from '../../resource/GetContentRootPermissionsRequest';
import {type ContentWizardPanel} from '../ContentWizardPanel';
import {AccessControlHelper} from '../AccessControlHelper';
import {ArchiveContentAction} from './ArchiveContentAction';
import {ContentSaveAction} from './ContentSaveAction';
import {CreateIssueAction} from './CreateIssueAction';
import {DuplicateContentAction} from './DuplicateContentAction';
import {LocalizeContentAction} from './LocalizeContentAction';
import {MarkAsReadyAction} from './MarkAsReadyAction';
import {MoveContentAction} from './MoveContentAction';
import {OpenRequestAction} from './OpenRequestAction';
import {PreviewAction} from './PreviewAction';
import {PublishAction} from './PublishAction';
import {PublishTreeAction} from './PublishTreeAction';
import {RequestPublishAction} from './RequestPublishAction';
import {ResetContentAction} from './ResetContentAction';
import {SaveAndCloseAction} from './SaveAndCloseAction';
import {ShowFormAction} from './ShowFormAction';
import {ShowLiveEditAction} from './ShowLiveEditAction';
import {UnpublishAction} from './UnpublishAction';
import {$wizardHasChanges, $wizardDraftName} from '../../../v6/features/store/wizardContent.store';
import {$wizardPersistedContent, $wizardIsNew, $wizardContentExistsInParentProject, $wizardContentSummary} from '../../../v6/features/store/wizardSave.store';
import {$wizardToolbar} from '../../../v6/features/store/wizardToolbar.store';
import {
    $wizardDeleteOnlyMode,
    $wizardContentCanBePublished,
    $wizardUserCanPublish,
    $wizardUserCanModify,
    $wizardIsContentValid,
    $wizardHasPublishRequest,
    $wizardContentCanBeMarkedAsReady,
} from '../../../v6/features/store/wizardActions.store';

type ActionNames =
    'SAVE' |
    'RESET' |
    'LOCALIZE' |
    'DELETE' |
    'DUPLICATE' |
    'PREVIEW' |
    'PUBLISH' |
    'PUBLISH_TREE' |
    'CREATE_ISSUE' |
    'UNPUBLISH' |
    'MARK_AS_READY' |
    'REQUEST_PUBLISH' |
    'OPEN_REQUEST' |
    'CLOSE' |
    'SHOW_LIVE_EDIT' |
    'SHOW_FORM' |
    'SAVE_AND_CLOSE';

export class ContentWizardActions
    extends WizardActions<Content> {

    private actionsMap: ActionsMap;

    private stateManager: ActionsStateManager;

    private beforeActionsStashedListeners: (() => void)[] = [];

    private actionsUnstashedListeners: (() => void)[] = [];

    private storeUnsubscribers: (() => void)[] = [];

    constructor(wizardPanel: ContentWizardPanel) {
        const contentSaveAction = new ContentSaveAction(wizardPanel);
        const resetContentAction = new ResetContentAction(wizardPanel);
        const archiveContentAction = new ArchiveContentAction();
        const duplicateContentAction = new DuplicateContentAction();
        const moveContentAction = new MoveContentAction();
        const previewAction = new PreviewAction();
        const publishAction = new PublishAction();
        const publishTreeAction = new PublishTreeAction();
        const createIssueAction = new CreateIssueAction();
        const unpublishAction = new UnpublishAction().setIconClass('unpublish-action');
        const markAsReadyAction = new MarkAsReadyAction();
        const requestPublishAction = new RequestPublishAction();
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
            localizeContentAction
        );

        this.actionsMap = {
            SAVE: contentSaveAction,
            RESET: resetContentAction,
            ARCHIVE: archiveContentAction,
            DUPLICATE: duplicateContentAction,
            MOVE: moveContentAction,
            PREVIEW: previewAction,
            PUBLISH: publishAction,
            PUBLISH_TREE: publishTreeAction,
            CREATE_ISSUE: createIssueAction,
            UNPUBLISH: unpublishAction,
            MARK_AS_READY: markAsReadyAction,
            REQUEST_PUBLISH: requestPublishAction,
            OPEN_REQUEST: openRequestAction,
            CLOSE: closeAction,
            SHOW_LIVE_EDIT: showLiveEditAction,
            SHOW_FORM: showFormAction,
            SAVE_AND_CLOSE: saveAndCloseAction,
            LOCALIZE: localizeContentAction,
        };

        const stashableActionsMap: ActionsMap = {
            ARCHIVE: this.actionsMap.ARCHIVE,
            DUPLICATE: this.actionsMap.DUPLICATE,
            MOVE: this.actionsMap.MOVE,
            PUBLISH: this.actionsMap.PUBLISH,
            PUBLISH_TREE: this.actionsMap.PUBLISH_TREE,
            UNPUBLISH: this.actionsMap.UNPUBLISH,
        };

        this.stateManager = new ActionsStateManager(this.actionsMap);

        ManagedActionManager.instance().onManagedActionStateChanged((state: ManagedActionState, executor: ManagedActionExecutor) => {
            if (state === ManagedActionState.PREPARING) {
                this.notifyBeforeActionsStashed();
                this.stateManager.stashActions(stashableActionsMap, false);
            } else if (state === ManagedActionState.ENDED) {
                this.stateManager.unstashActions(stashableActionsMap);
                this.notifyActionsUnstashed();
            }
        });
    }

    initUnsavedChangesListeners() {
        this.disposeStoreSubscriptions();

        this.storeUnsubscribers.push(
            $wizardHasChanges.subscribe(() => {
                this.doCheckSaveActionStateHandler();
            }),
        );

        this.storeUnsubscribers.push(
            $wizardDraftName.subscribe(() => {
                this.enableActions({MOVE: !$wizardDeleteOnlyMode.get()});
            }),
        );
    }

    private disposeStoreSubscriptions(): void {
        for (const unsubscribe of this.storeUnsubscribers) {
            unsubscribe();
        }
        this.storeUnsubscribers = [];
    }

    private isPersistedUnnamed(): boolean {
        const persistedContent = $wizardPersistedContent.get();
        return !persistedContent || persistedContent.getName().isUnnamed();
    }

    private isUnnamedContent(): boolean {
        const draftName = $wizardDraftName.get();
        return (!draftName || draftName.isUnnamed()) && this.isPersistedUnnamed();
    }

    private doCheckSaveActionStateHandler(): void {
        const persistedContent = $wizardPersistedContent.get();
        const hasChanges = $wizardHasChanges.get();
        const userCanModify = $wizardUserCanModify.get();

        let isEnabled: boolean = hasChanges &&
                                 (this.isUnnamedContent() || this.isHeaderValidForSaving());

        if (persistedContent) {
            isEnabled = isEnabled &&
                        persistedContent.isEditable() &&
                        userCanModify &&
                        !persistedContent.isDataInherited();
        }
        this.enableActions({SAVE: isEnabled});

        const canSave = hasChanges || isEnabled || !this.getSaveAction().isSavedStateEnabled();
        this.getSaveAction().setLabel(i18n(canSave ? 'action.save' : 'action.saved'));
    }

    private isHeaderValidForSaving(): boolean {
        const draftName = $wizardDraftName.get();
        if (!draftName) {
            return false;
        }

        const nameStr = draftName.toString().trim();
        return nameStr.length > 0 && $wizardToolbar.get().isPathAvailable;
    }

    private enableActions(state: ActionsState) {
        this.stateManager.enableActions(state);
    }

    private isActionEnabled(name: ActionNames) {
        return this.stateManager.isActionEnabled(name);
    }

    refreshActions(): Q.Promise<void> {
        const persistedContent = $wizardPersistedContent.get();

        if (persistedContent) {
            this.actionsMap.SAVE.setVisible(!persistedContent.isDataInherited());
        }

        if ($wizardIsNew.get()) {
            this.enableActionsForNew();
        } else if (persistedContent) {
            return this.enableActionsForExisting(persistedContent);
        }

        return Q();
    }

    enableActionsForNew() {
        this.stateManager.enableActions({});
        this.enableActions({
            SAVE: $wizardHasChanges.get(),
            ARCHIVE: true,
            MOVE: !this.isPersistedUnnamed(),
        });
        this.actionsMap.RESET.setVisible(false);
        this.actionsMap.LOCALIZE.setVisible(false);
        (this.actionsMap.PREVIEW as PreviewAction).setWritePermissions(true);
    }

    enableActionsForExisting(existing: Content): Q.Promise<void> {
        this.enableActions({
            ARCHIVE: existing.isDeletable()
        });

        this.enableActionsForExistingByPermissions(existing);
        this.enableActions({
            SAVE: existing.isEditable() && $wizardHasChanges.get() && !existing.isDataInherited()
        });

        return Q();
    }

    setDeleteOnlyMode(content: Content, valueOn: boolean = true) {
        if ($wizardDeleteOnlyMode.get() === valueOn) {
            return;
        }
        $wizardDeleteOnlyMode.set(valueOn);
        const nonDeleteMode = !valueOn;

        this.enableActions({
            DUPLICATE: nonDeleteMode,
            MOVE: nonDeleteMode && !this.isPersistedUnnamed(),
            PUBLISH: nonDeleteMode,
            CREATE_ISSUE: nonDeleteMode,
            UNPUBLISH: nonDeleteMode,
        });

        if (valueOn) {
            this.enableDeleteIfAllowed(content);
        } else {
            this.enableActions({ARCHIVE: true});
            this.enableActionsForExistingByPermissions(content);
        }
    }

    private enableDeleteIfAllowed(content: Content) {
        const hasDeletePermission = AccessControlHelper.hasPermission(Permission.DELETE, content.getPermissions());
        this.enableActions({ARCHIVE: hasDeletePermission});
    }

    private enableActionsForExistingByPermissions(existing: Content): void {
        const userCanModify = AccessControlHelper.hasPermission(Permission.MODIFY, existing.getPermissions());
        const hasDeletePermission = AccessControlHelper.hasPermission(Permission.DELETE, existing.getPermissions());
        const userCanPublish = AccessControlHelper.hasPermission(Permission.PUBLISH, existing.getPermissions());

        $wizardUserCanModify.set(userCanModify);
        $wizardUserCanPublish.set(userCanPublish);

        (this.actionsMap.PREVIEW as PreviewAction).setWritePermissions(userCanModify);

        if (!userCanModify) {
            this.enableActions({SAVE: false, SAVE_AND_CLOSE: false, MARK_AS_READY: false, RESET: false, LOCALIZE: false});
        }
        if (!hasDeletePermission) {
            this.enableActions({ARCHIVE: false});
        }
        if (!userCanPublish) {
            this.enableActions({
                PUBLISH: false,
                CREATE_ISSUE: true,
                UNPUBLISH: false,
                PUBLISH_TREE: false,
            });
        }

        if (existing.hasParent()) {
            new GetContentByPathRequest(existing.getPath().getParentPath()).sendAndParse().then(
                (parent: Content) => {
                    new GetContentPermissionsByIdRequest(parent.getContentId()).sendAndParse().then(
                        (accessControlList: AccessControlList) => {
                            const hasParentCreatePermission = AccessControlHelper.hasPermission(Permission.CREATE, accessControlList);

                            if (!hasParentCreatePermission) {
                                this.enableActions({DUPLICATE: false});
                            }
                        });
                });
        } else {
            new GetContentRootPermissionsRequest().sendAndParse().then(
                (accessControlList: AccessControlList) => {
                    const hasParentCreatePermission = AccessControlHelper.hasPermission(Permission.CREATE, accessControlList);

                    if (!hasParentCreatePermission) {
                        this.enableActions({DUPLICATE: false});
                    }
                });
        }
    }

    setContent(content: ContentSummaryAndCompareStatus): ContentWizardActions {
        return this;
    }

    setContentCanBePublished(value: boolean): ContentWizardActions {
        $wizardContentCanBePublished.set(value);
        return this;
    }

    setUserCanPublish(value: boolean): ContentWizardActions {
        $wizardUserCanPublish.set(value);
        return this;
    }

    setUserCanModify(value: boolean): ContentWizardActions {
        $wizardUserCanModify.set(value);
        return this;
    }

    setIsValid(value: boolean): ContentWizardActions {
        $wizardIsContentValid.set(value);
        return this;
    }

    setContentCanBeMarkedAsReady(value: boolean): ContentWizardActions {
        $wizardContentCanBeMarkedAsReady.set(value);
        return this;
    }

    setHasPublishRequest(value: boolean): ContentWizardActions {
        $wizardHasPublishRequest.set(value);
        return this;
    }

    refreshState() {
        const content = $wizardContentSummary.get();
        if (!content) {
            return;
        }

        this.doRefreshState(content);
    }

    private doRefreshState(content: ContentSummaryAndCompareStatus) {
        const contentCanBePublished = $wizardContentCanBePublished.get();
        const userCanPublish = $wizardUserCanPublish.get();
        const userCanModify = $wizardUserCanModify.get();
        const isContentValid = $wizardIsContentValid.get();
        const hasPublishRequest = $wizardHasPublishRequest.get();
        const contentCanBeMarkedAsReady = $wizardContentCanBeMarkedAsReady.get();

        const canBePublished: boolean = this.canBePublished(content, contentCanBePublished, userCanPublish, userCanModify);
        const canBeUnpublished: boolean = content.isPublished() && userCanPublish;
        const canBeMarkedAsReady: boolean = contentCanBeMarkedAsReady && userCanModify;
        const canBeRequestedPublish: boolean = isContentValid && !content.isOnline();
        const isInheritedItem: boolean = $wizardContentExistsInParentProject.get() && content.hasOriginProject();
        const canBeReset: boolean = isInheritedItem && !content.isFullyInherited();
        const canBeLocalized: boolean = isInheritedItem && content.isDataInherited();

        this.enableActions({
            PUBLISH: canBePublished,
            CREATE_ISSUE: true,
            UNPUBLISH: canBeUnpublished,
            MARK_AS_READY: canBeMarkedAsReady,
            REQUEST_PUBLISH: canBeRequestedPublish,
            OPEN_REQUEST: hasPublishRequest,
            RESET: userCanModify && canBeReset,
            LOCALIZE: userCanModify && canBeLocalized
        });

        this.actionsMap.OPEN_REQUEST.setVisible(hasPublishRequest);
        this.actionsMap.RESET.setVisible(canBeReset);
        this.actionsMap.LOCALIZE.setVisible(canBeLocalized);
    }

    private canBePublished(
        content: ContentSummaryAndCompareStatus,
        contentCanBePublished: boolean,
        userCanPublish: boolean,
        userCanModify: boolean,
    ): boolean {
        if (!contentCanBePublished) {
            return false;
        }

        if (!userCanPublish) {
            return false;
        }

        if (content.isOnline()) {
            return false;
        }

        if (!userCanModify && content.getContentSummary().isInProgress()) {
            return false;
        }

        return true;
    }

    isOnline(): boolean {
        const content = $wizardContentSummary.get();
        return !!content && content.isOnline();
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
        return this.actionsMap.ARCHIVE;
    }

    getResetAction(): Action {
        return this.actionsMap.RESET;
    }

    getLocalizeAction(): Action {
        return this.actionsMap.LOCALIZE;
    }

    getSaveAction(): ContentSaveAction {
        return this.actionsMap.SAVE as ContentSaveAction;
    }

    getDuplicateAction(): Action {
        return this.actionsMap.DUPLICATE;
    }

    getMoveAction(): Action {
        return this.actionsMap.MOVE;
    }

    getCloseAction(): Action {
        return this.actionsMap.CLOSE;
    }

    getPublishAction(): PublishAction {
        return this.actionsMap.PUBLISH as PublishAction;
    }

    getPublishTreeAction(): Action {
        return this.actionsMap.PUBLISH_TREE;
    }

    getCreateIssueAction(): Action {
        return this.actionsMap.CREATE_ISSUE;
    }

    getUnpublishAction(): Action {
        return this.actionsMap.UNPUBLISH;
    }

    getMarkAsReadyAction(): Action {
        return this.actionsMap.MARK_AS_READY;
    }

    getRequestPublishAction(): Action {
        return this.actionsMap.REQUEST_PUBLISH;
    }

    getOpenRequestAction(): Action {
        return this.actionsMap.OPEN_REQUEST;
    }

    getPreviewAction(): Action {
        return this.actionsMap.PREVIEW;
    }

    getShowLiveEditAction(): Action {
        return this.actionsMap.SHOW_LIVE_EDIT;
    }

    getShowFormAction(): Action {
        return this.actionsMap.SHOW_FORM;
    }
}
