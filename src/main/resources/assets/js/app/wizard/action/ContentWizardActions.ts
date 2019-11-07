import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {DuplicateContentAction} from './DuplicateContentAction';
import {DeleteContentAction} from './DeleteContentAction';
import {PublishAction} from './PublishAction';
import {PublishTreeAction} from './PublishTreeAction';
import {CreateIssueAction} from './CreateIssueAction';
import {UnpublishAction} from './UnpublishAction';
import {PreviewAction} from './PreviewAction';
import {ShowLiveEditAction} from './ShowLiveEditAction';
import {ShowFormAction} from './ShowFormAction';
import {ShowSplitEditAction} from './ShowSplitEditAction';
import {UndoPendingDeleteAction} from './UndoPendingDeleteAction';
import {ContentSaveAction} from './ContentSaveAction';
import {GetContentRootPermissionsRequest} from '../../resource/GetContentRootPermissionsRequest';
import {GetContentPermissionsByIdRequest} from '../../resource/GetContentPermissionsByIdRequest';
import {PermissionHelper} from '../PermissionHelper';
import {SaveAndCloseAction} from './SaveAndCloseAction';
import {GetContentByPathRequest} from '../../resource/GetContentByPathRequest';
import {Content} from '../../content/Content';
import {CompareStatusChecker} from '../../content/CompareStatus';
import {AccessControlList} from '../../access/AccessControlList';
import {Permission} from '../../access/Permission';
import {MarkAsReadyAction} from './MarkAsReadyAction';
import {RequestPublishAction} from './RequestPublishAction';
import {OpenRequestAction} from './OpenRequestAction';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {Action} from 'lib-admin-ui/ui/Action';
import {CloseAction} from 'lib-admin-ui/app/wizard/CloseAction';
import {ManagedActionManager} from 'lib-admin-ui/managedaction/ManagedActionManager';
import {ManagedActionExecutor} from 'lib-admin-ui/managedaction/ManagedActionExecutor';
import {ManagedActionState} from 'lib-admin-ui/managedaction/ManagedActionState';
import {ActionsStateManager} from 'lib-admin-ui/ui/ActionsStateManager';
import {WizardActions} from 'lib-admin-ui/app/wizard/WizardActions';
import {IsAuthenticatedRequest} from 'lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from 'lib-admin-ui/security/auth/LoginResult';

type ActionNames =
    'SAVE' |
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
    'SHOW_SPLIT_EDIT' |
    'SAVE_AND_CLOSE' |
    'PUBLISH_MOBILE' |
    'UNDO_PENDING_DELETE';

type ActionsMap = {
    SAVE?: Action,
    DELETE?: Action,
    DUPLICATE?: Action,
    PREVIEW?: Action,
    PUBLISH?: Action,
    PUBLISH_TREE?: Action,
    CREATE_ISSUE?: Action,
    UNPUBLISH?: Action,
    MARK_AS_READY?: Action,
    REQUEST_PUBLISH?: Action,
    OPEN_REQUEST?: Action,
    CLOSE?: Action,
    SHOW_LIVE_EDIT?: Action,
    SHOW_FORM?: Action,
    SHOW_SPLIT_EDIT?: Action,
    SAVE_AND_CLOSE?: Action,
    PUBLISH_MOBILE?: Action,
    UNDO_PENDING_DELETE?: Action,
};

type ActionsState = {
    SAVE?: boolean,
    DELETE?: boolean,
    DUPLICATE?: boolean,
    PREVIEW?: boolean,
    PUBLISH?: boolean,
    PUBLISH_TREE?: boolean,
    CREATE_ISSUE?: boolean,
    UNPUBLISH?: boolean,
    MARK_AS_READY?: boolean,
    REQUEST_PUBLISH?: boolean,
    OPEN_REQUEST?: boolean,
    CLOSE?: boolean,
    SHOW_LIVE_EDIT?: boolean,
    SHOW_FORM?: boolean,
    SHOW_SPLIT_EDIT?: boolean,
    SAVE_AND_CLOSE?: boolean,
    PUBLISH_MOBILE?: boolean,
    UNDO_PENDING_DELETE?: boolean,
};

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

    private beforeActionsStashedListeners: { (): void; }[] = [];

    private actionsUnstashedListeners: { (): void; }[] = [];

    constructor(wizardPanel: ContentWizardPanel) {
        super(
            new ContentSaveAction(wizardPanel),
            new DeleteContentAction(wizardPanel),
            new DuplicateContentAction(wizardPanel),
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
            new ShowSplitEditAction(wizardPanel),
            new SaveAndCloseAction(wizardPanel),
            new PublishAction(wizardPanel),
            new UndoPendingDeleteAction(wizardPanel)
        );

        this.wizardPanel = wizardPanel;

        const actions = this.getActions();

        this.actionsMap = {
            SAVE: actions[0],
            DELETE: actions[1],
            DUPLICATE: actions[2],
            PREVIEW: actions[3],
            PUBLISH: actions[4],
            PUBLISH_TREE: actions[5],
            CREATE_ISSUE: actions[6],
            UNPUBLISH: actions[7],
            MARK_AS_READY: actions[8],
            REQUEST_PUBLISH: actions[9],
            OPEN_REQUEST: actions[10],
            CLOSE: actions[11],
            SHOW_LIVE_EDIT: actions[12],
            SHOW_FORM: actions[13],
            SHOW_SPLIT_EDIT: actions[14],
            SAVE_AND_CLOSE: actions[15],
            PUBLISH_MOBILE: actions[16],
            UNDO_PENDING_DELETE: actions[17],
        };

        const stashableActionsMap: ActionsMap = {
            DELETE: this.actionsMap.DELETE,
            DUPLICATE: this.actionsMap.DUPLICATE,
            PUBLISH: this.actionsMap.PUBLISH,
            PUBLISH_TREE: this.actionsMap.PUBLISH_TREE,
            UNPUBLISH: this.actionsMap.UNPUBLISH,
            PUBLISH_MOBILE: this.actionsMap.PUBLISH_MOBILE,
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
            this.wizardPanel.unPermissionItemsAdded(this.checkSaveActionStateHandler);
            this.wizardPanel.unPermissionItemsRemoved(this.checkSaveActionStateHandler);
            this.wizardPanel.unPermissionItemChanged(this.checkSaveActionStateHandler);
            this.wizardPanel.unDataChanged(this.checkSaveActionStateHandler);
            this.wizardPanel.unLiveModelChanged(this.checkSaveActionStateHandler);
        }

        this.checkSaveActionStateHandler = AppHelper.debounce(() => {
            let isEnabled: boolean = this.wizardPanel.hasUnsavedChanges();

            if (this.persistedContent) {

                const overwritePermissions = this.wizardPanel.getSecurityWizardStepForm() &&
                                             this.wizardPanel.getSecurityWizardStepForm().isOverwritePermissions();

                isEnabled = (isEnabled || overwritePermissions) &&
                            this.persistedContent.isEditable() &&
                            !this.isPendingDelete() &&
                            this.userCanModify;
            }
            this.enableActions({ SAVE: isEnabled });

            this.getSaveAction().setLabel(i18n(isEnabled || !this.getSaveAction().isSavedStateEnabled() ? 'action.save' : 'action.saved'));

        }, 100, false);

        this.wizardPanel.onPermissionItemsAdded(this.checkSaveActionStateHandler);
        this.wizardPanel.onPermissionItemsRemoved(this.checkSaveActionStateHandler);
        this.wizardPanel.onPermissionItemChanged(this.checkSaveActionStateHandler);
        this.wizardPanel.onDataChanged(this.checkSaveActionStateHandler);
        this.wizardPanel.onLiveModelChanged(this.checkSaveActionStateHandler);
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

    refreshPendingDeleteDecorations(): Q.Promise<any> {
        const isPendingDelete = this.isPendingDelete();

        this.actionsMap.UNDO_PENDING_DELETE.setVisible(isPendingDelete);
        this.actionsMap.SAVE.setVisible(!isPendingDelete);
        this.actionsMap.DELETE.setVisible(!isPendingDelete);
        this.actionsMap.DUPLICATE.setVisible(!isPendingDelete);
        this.actionsMap.UNPUBLISH.setVisible(!isPendingDelete);
        this.actionsMap.PREVIEW.setVisible(this.isActionEnabled('PREVIEW') && !isPendingDelete);

        if (isPendingDelete) {
            this.enableActions({
                SAVE: false,
                DELETE: false,
                DUPLICATE: false
            });
        } else {
            if (this.wizardPanel.isNew()) {
                this.enableActionsForNew();
            } else {
                return this.enableActionsForExisting(this.wizardPanel.getPersistedItem());
            }
        }

        return Q(null);
    }

    isPendingDelete(): boolean {
        const compareStatus = this.wizardPanel.getCompareStatus();
        return CompareStatusChecker.isPendingDelete(compareStatus);
    }

    enableActionsForNew() {
        this.persistedContent = null;
        this.stateManager.enableActions({});
        this.enableActions({SAVE: false, DELETE: true});
        (<PreviewAction>this.actionsMap.PREVIEW).setWritePermissions(true);
    }

    enableActionsForExisting(existing: Content): Q.Promise<any> {
        this.persistedContent = existing;

        this.enableActions({
            DELETE: existing.isDeletable()
        });

        return this.enableActionsForExistingByPermissions(existing).then(() => {
            this.enableActions({
                SAVE: existing.isEditable() && this.wizardPanel.hasUnsavedChanges() && !this.isPendingDelete()
            });
        });
    }

    setDeleteOnlyMode(content: Content, valueOn: boolean = true) {
        if (this.deleteOnlyMode === valueOn) {
            return;
        }
        this.deleteOnlyMode = valueOn;
        const nonDeleteMode = !valueOn;

        this.enableActions({
            DUPLICATE: nonDeleteMode,
            PUBLISH: nonDeleteMode,
            CREATE_ISSUE: nonDeleteMode,
            UNPUBLISH: nonDeleteMode,
            PUBLISH_MOBILE: nonDeleteMode,
        });

        this.actionsMap.PUBLISH_MOBILE.setVisible(!valueOn);

        if (valueOn) {
            this.enableDeleteIfAllowed(content);
        } else {
            this.enableActions({DELETE: true});
            this.enableActionsForExistingByPermissions(content);
        }
    }

    private enableDeleteIfAllowed(content: Content) {
        new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            let hasDeletePermission = PermissionHelper.hasPermission(Permission.DELETE,
                loginResult, content.getPermissions());
            this.enableActions({DELETE: hasDeletePermission});
        });
    }

    private enableActionsForExistingByPermissions(existing: Content): Q.Promise<any> {
        return new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {

            const hasModifyPermission = PermissionHelper.hasPermission(Permission.MODIFY, loginResult, existing.getPermissions());
            const hasDeletePermission = PermissionHelper.hasPermission(Permission.DELETE, loginResult, existing.getPermissions());
            const hasPublishPermission = PermissionHelper.hasPermission(Permission.PUBLISH, loginResult, existing.getPermissions());

            (<PreviewAction>this.actionsMap.PREVIEW).setWritePermissions(hasModifyPermission);

            if (!hasModifyPermission) {
                this.enableActions({SAVE: false, SAVE_AND_CLOSE: false, MARK_AS_READY: false});
            }
            if (!hasDeletePermission) {
                this.enableActions({DELETE: false});
            }
            if (!hasPublishPermission) {
                this.enableActions({
                    PUBLISH: false,
                    CREATE_ISSUE: true,
                    UNPUBLISH: false,
                    PUBLISH_TREE: false,
                    PUBLISH_MOBILE: false,
                });

                this.actionsMap.PUBLISH_MOBILE.setVisible(false);
            }

            if (existing.hasParent()) {
                new GetContentByPathRequest(existing.getPath().getParentPath()).sendAndParse().then(
                    (parent: Content) => {
                        new GetContentPermissionsByIdRequest(parent.getContentId()).sendAndParse().then(
                            (accessControlList: AccessControlList) => {
                                let hasParentCreatePermission = PermissionHelper.hasPermission(
                                    Permission.CREATE,
                                    loginResult,
                                    accessControlList);

                                if (!hasParentCreatePermission) {
                                    this.enableActions({DUPLICATE: false});
                                }
                            });
                    });
            } else {
                new GetContentRootPermissionsRequest().sendAndParse().then(
                    (accessControlList: AccessControlList) => {
                        let hasParentCreatePermission = PermissionHelper.hasPermission(Permission.CREATE,
                            loginResult,
                            accessControlList);

                        if (!hasParentCreatePermission) {
                            this.enableActions({DUPLICATE: false});
                        }
                    });
            }

        });
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

        this.enableActions({
            PUBLISH: canBePublished,
            CREATE_ISSUE: true,
            UNPUBLISH: canBeUnpublished,
            PUBLISH_MOBILE: canBePublished,
            MARK_AS_READY: canBeMarkedAsReady,
            REQUEST_PUBLISH: canBeRequestedPublish,
            OPEN_REQUEST: this.hasPublishRequest
        });

        this.actionsMap.PUBLISH_MOBILE.setVisible(canBePublished);
        this.actionsMap.OPEN_REQUEST.setVisible(this.hasPublishRequest);
    }

    private canBePublished(): boolean {
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

    getDeleteAction(): Action {
        return this.actionsMap.DELETE;
    }

    getSaveAction(): ContentSaveAction {
        return <ContentSaveAction>this.actionsMap.SAVE;
    }

    getDuplicateAction(): Action {
        return this.actionsMap.DUPLICATE;
    }

    getCloseAction(): Action {
        return this.actionsMap.CLOSE;
    }

    getPublishAction(): PublishAction {
        return <PublishAction>this.actionsMap.PUBLISH;
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

    getShowSplitEditAction(): Action {
        return this.actionsMap.SHOW_SPLIT_EDIT;
    }

    getPublishMobileAction(): Action {
        return this.actionsMap.PUBLISH_MOBILE;
    }

    getUndoPendingDeleteAction(): Action {
        return this.actionsMap.UNDO_PENDING_DELETE;
    }
}
