import {CloseAction} from '@enonic/lib-admin-ui/app/wizard/CloseAction';
import {WizardActions} from '@enonic/lib-admin-ui/app/wizard/WizardActions';
import {ManagedActionExecutor} from '@enonic/lib-admin-ui/managedaction/ManagedActionExecutor';
import {ManagedActionManager} from '@enonic/lib-admin-ui/managedaction/ManagedActionManager';
import {ManagedActionState} from '@enonic/lib-admin-ui/managedaction/ManagedActionState';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ActionsMap, ActionsState, ActionsStateManager} from '@enonic/lib-admin-ui/ui/ActionsStateManager';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {AccessControlList} from '../../access/AccessControlList';
import {Permission} from '../../access/Permission';
import {CompareStatusChecker} from '../../content/CompareStatus';
import {Content} from '../../content/Content';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {GetContentByPathRequest} from '../../resource/GetContentByPathRequest';
import {GetContentPermissionsByIdRequest} from '../../resource/GetContentPermissionsByIdRequest';
import {GetContentRootPermissionsRequest} from '../../resource/GetContentRootPermissionsRequest';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {PermissionHelper} from '../PermissionHelper';
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
import {UndoPendingDeleteAction} from './UndoPendingDeleteAction';
import {UnpublishAction} from './UnpublishAction';

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
    'SAVE_AND_CLOSE' |
    'UNDO_PENDING_DELETE';

export class ContentWizardActions
    extends WizardActions<Content> {

    private deleteOnlyMode: boolean = false;

    private persistedContent: Content;

    private contentCanBePublished: boolean = false;

    private userCanPublish: boolean = true;

    private userCanModify: boolean = true;

    private isContentValid: boolean = false;

    private hasPublishRequest: boolean = false;

    private contentCanBeMarkedAsReady: boolean = false;

    private content: ContentSummaryAndCompareStatus;

    private wizardPanel: ContentWizardPanel;

    private actionsMap: ActionsMap;

    private stateManager: ActionsStateManager;

    private checkSaveActionStateHandler: () => void;

    private beforeActionsStashedListeners: (() => void)[] = [];

    private actionsUnstashedListeners: (() => void)[] = [];

    constructor(wizardPanel: ContentWizardPanel) {
        super(
            new ContentSaveAction(wizardPanel),
            new ResetContentAction(wizardPanel),
            new ArchiveContentAction(wizardPanel),
            new DuplicateContentAction(wizardPanel),
            new MoveContentAction(wizardPanel),
            new PreviewAction(wizardPanel),
            new PublishAction(wizardPanel),
            new PublishTreeAction(wizardPanel),
            new CreateIssueAction(wizardPanel),
            new UnpublishAction(wizardPanel)
                .setIconClass('unpublish-action'),
            new MarkAsReadyAction(wizardPanel),
            new RequestPublishAction(wizardPanel),
            new OpenRequestAction(),
            new CloseAction(wizardPanel),
            new ShowLiveEditAction(wizardPanel),
            new ShowFormAction(wizardPanel),
            new SaveAndCloseAction(wizardPanel),
            new UndoPendingDeleteAction(wizardPanel),
            new LocalizeContentAction(wizardPanel)
        );

        this.wizardPanel = wizardPanel;

        const actions = this.getActions();

        this.actionsMap = {
            SAVE: actions[0],
            RESET: actions[1],
            ARCHIVE: actions[2],
            DUPLICATE: actions[3],
            MOVE: actions[4],
            PREVIEW: actions[5],
            PUBLISH: actions[6],
            PUBLISH_TREE: actions[7],
            CREATE_ISSUE: actions[8],
            UNPUBLISH: actions[9],
            MARK_AS_READY: actions[10],
            REQUEST_PUBLISH: actions[11],
            OPEN_REQUEST: actions[12],
            CLOSE: actions[13],
            SHOW_LIVE_EDIT: actions[14],
            SHOW_FORM: actions[15],
            SAVE_AND_CLOSE: actions[16],
            UNDO_PENDING_DELETE: actions[17],
            LOCALIZE: actions[18],
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
        if (this.checkSaveActionStateHandler) {
            this.wizardPanel.unDataChanged(this.checkSaveActionStateHandler);
        }

        let checkSaveStateOnWizardRendered: boolean = false;

        this.checkSaveActionStateHandler = AppHelper.debounce(() => {
            if (this.wizardPanel.isRendered()) {
                this.doCheckSaveActionStateHandler();
            } else {
                if (!checkSaveStateOnWizardRendered) {
                    this.wizardPanel.whenRendered(() => {
                        this.doCheckSaveActionStateHandler();
                        checkSaveStateOnWizardRendered = false;
                    });

                    checkSaveStateOnWizardRendered = true;
                }

            }
        }, 100, false);

        this.wizardPanel.onDataChanged(this.checkSaveActionStateHandler);
        this.wizardPanel.onPageStateChanged(this.checkSaveActionStateHandler);
        this.wizardPanel.onContentNamed((c) => {
            this.enableActions({MOVE: !this.deleteOnlyMode});
        });
    }

    private isPersistedUnnamed(): boolean {
        return !this.persistedContent || this.persistedContent.getName().isUnnamed();
    }

    private isUnnamedContent(): boolean {
        return !this.wizardPanel.getWizardHeader().getName() && this.isPersistedUnnamed();
    }

    private doCheckSaveActionStateHandler(): void {
        let isEnabled: boolean = this.wizardPanel.hasUnsavedChanges() &&
                                 (this.isUnnamedContent() || this.wizardPanel.isHeaderValidForSaving());

        if (this.persistedContent) {
            isEnabled = isEnabled &&
                        this.persistedContent.isEditable() &&
                        !this.isPendingDelete() &&
                        this.userCanModify &&
                        !this.persistedContent.isDataInherited();
        }
        this.enableActions({SAVE: isEnabled});

        const canSave = this.wizardPanel.hasUnsavedChanges() || isEnabled || !this.getSaveAction().isSavedStateEnabled();
        this.getSaveAction().setLabel(i18n(canSave ? 'action.save' : 'action.saved'));
    }

    refreshSaveActionState() {
        if (this.checkSaveActionStateHandler) {
            this.checkSaveActionStateHandler();
        }
    }

    private enableActions(state: ActionsState) {
        this.stateManager.enableActions(state);
    }

    private isActionEnabled(name: ActionNames) {
        return this.stateManager.isActionEnabled(name);
    }

    refreshPendingDeleteDecorations(): Q.Promise<void> {
        const isPendingDelete = this.isPendingDelete();

        this.actionsMap.UNDO_PENDING_DELETE.setVisible(isPendingDelete);
        this.actionsMap.SAVE.setVisible(!isPendingDelete && !this.wizardPanel.getPersistedItem().isDataInherited());
        this.actionsMap.ARCHIVE.setVisible(!isPendingDelete);
        this.actionsMap.DUPLICATE.setVisible(!isPendingDelete);
        this.actionsMap.MOVE.setVisible(!isPendingDelete);
        this.actionsMap.UNPUBLISH.setVisible(!isPendingDelete);

        if (isPendingDelete) {
            this.enableActions({
                SAVE: false,
                RESET: false,
                LOCALIZE: false,
                ARCHIVE: false,
                DUPLICATE: false,
                MOVE: false,
            });
        } else {
            if (this.wizardPanel.isNew()) {
                this.enableActionsForNew();
            } else {
                return this.enableActionsForExisting(this.wizardPanel.getPersistedItem());
            }
        }

        return Q();
    }

    isPendingDelete(): boolean {
        const compareStatus = this.wizardPanel.getCompareStatus();
        return CompareStatusChecker.isPendingDelete(compareStatus);
    }

    enableActionsForNew() {
        this.persistedContent = null;
        this.stateManager.enableActions({});
        this.enableActions({
            SAVE: this.wizardPanel.hasUnsavedChanges(),
            ARCHIVE: true,
            MOVE: !this.isPersistedUnnamed(),
        });
        this.actionsMap.RESET.setVisible(false);
        this.actionsMap.LOCALIZE.setVisible(false);
        (this.actionsMap.PREVIEW as PreviewAction).setWritePermissions(true);
    }

    enableActionsForExisting(existing: Content): Q.Promise<void> {
        this.persistedContent = existing;

        this.enableActions({
            ARCHIVE: existing.isDeletable()
        });

        this.enableActionsForExistingByPermissions(existing);
        this.enableActions({
            SAVE: existing.isEditable() && this.wizardPanel.hasUnsavedChanges() && !this.isPendingDelete() &&
                  !existing.isDataInherited()
        });

        return Q.resolve();
    }

    setDeleteOnlyMode(content: Content, valueOn: boolean = true) {
        if (this.deleteOnlyMode === valueOn) {
            return;
        }
        this.deleteOnlyMode = valueOn;
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
        let hasDeletePermission = PermissionHelper.hasPermission(Permission.DELETE, content.getPermissions());
        this.enableActions({ARCHIVE: hasDeletePermission});
    }

    private enableActionsForExistingByPermissions(existing: Content): void {
        this.userCanModify = PermissionHelper.hasPermission(Permission.MODIFY, existing.getPermissions());
        const hasDeletePermission = PermissionHelper.hasPermission(Permission.DELETE, existing.getPermissions());
        this.userCanPublish = PermissionHelper.hasPermission(Permission.PUBLISH, existing.getPermissions());

        (this.actionsMap.PREVIEW as PreviewAction).setWritePermissions(this.userCanModify);

        if (!this.userCanModify) {
            this.enableActions({SAVE: false, SAVE_AND_CLOSE: false, MARK_AS_READY: false, RESET: false, LOCALIZE: false});
        }
        if (!hasDeletePermission) {
            this.enableActions({ARCHIVE: false});
        }
        if (!this.userCanPublish) {
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
                            let hasParentCreatePermission = PermissionHelper.hasPermission(Permission.CREATE, accessControlList);

                            if (!hasParentCreatePermission) {
                                this.enableActions({DUPLICATE: false});
                            }
                        });
                });
        } else {
            new GetContentRootPermissionsRequest().sendAndParse().then(
                (accessControlList: AccessControlList) => {
                    let hasParentCreatePermission = PermissionHelper.hasPermission(Permission.CREATE, accessControlList);

                    if (!hasParentCreatePermission) {
                        this.enableActions({DUPLICATE: false});
                    }
                });
        }
    }

    setContent(content: ContentSummaryAndCompareStatus): ContentWizardActions {
        this.content = content;
        return this;
    }

    setContentCanBePublished(value: boolean): ContentWizardActions {
        this.contentCanBePublished = value;
        return this;
    }

    setUserCanPublish(value: boolean): ContentWizardActions {
        this.userCanPublish = value;
        return this;
    }

    setUserCanModify(value: boolean): ContentWizardActions {
        this.userCanModify = value;
        return this;
    }

    setIsValid(value: boolean): ContentWizardActions {
        this.isContentValid = value;
        return this;
    }

    setContentCanBeMarkedAsReady(value: boolean): ContentWizardActions {
        this.contentCanBeMarkedAsReady = value;
        return this;
    }

    setHasPublishRequest(value: boolean): ContentWizardActions {
        this.hasPublishRequest = value;
        return this;
    }

    refreshState() {
        if (!this.content) {
            return;
        }

        this.doRefreshState();
    }

    private doRefreshState() {
        const canBePublished: boolean = this.canBePublished();
        const canBeUnpublished: boolean = this.content.isPublished() && this.userCanPublish;
        const canBeMarkedAsReady: boolean = this.contentCanBeMarkedAsReady && this.userCanModify;
        const canBeRequestedPublish: boolean = this.isContentValid && !this.content.isOnline() && !this.content.isPendingDelete();
        const isInheritedItem: boolean = this.wizardPanel.isContentExistsInParentProject() && this.content.hasOriginProject();
        const canBeReset: boolean = isInheritedItem && !this.content.isFullyInherited();
        const canBeLocalized: boolean = isInheritedItem && this.content.isDataInherited();

        this.enableActions({
            PUBLISH: canBePublished,
            CREATE_ISSUE: true,
            UNPUBLISH: canBeUnpublished,
            MARK_AS_READY: canBeMarkedAsReady,
            REQUEST_PUBLISH: canBeRequestedPublish,
            OPEN_REQUEST: this.hasPublishRequest,
            RESET: this.userCanModify && canBeReset,
            LOCALIZE: this.userCanModify && canBeLocalized
        });

        this.actionsMap.OPEN_REQUEST.setVisible(this.hasPublishRequest);
        this.actionsMap.RESET.setVisible(canBeReset);
        this.actionsMap.LOCALIZE.setVisible(canBeLocalized);
    }

    canBePublished(): boolean {
        if (!this.contentCanBePublished) {
            return false;
        }

        if (!this.userCanPublish) {
            return false;
        }

        if (this.isOnline()) {
            return false;
        }

        if (!this.userCanModify && this.content.getContentSummary().isInProgress()) {
            return false;
        }

        return true;
    }

    isOnline(): boolean {
        return !!this.content && this.content.isOnline();
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

    getUndoPendingDeleteAction(): Action {
        return this.actionsMap.UNDO_PENDING_DELETE;
    }
}
