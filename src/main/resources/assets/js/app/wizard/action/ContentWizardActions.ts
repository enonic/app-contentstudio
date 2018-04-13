import '../../../api.ts';
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
import Action = api.ui.Action;
import CloseAction = api.app.wizard.CloseAction;
import SaveAndCloseAction = api.app.wizard.SaveAndCloseAction;
import i18n = api.util.i18n;
import ManagedActionManager = api.managedaction.ManagedActionManager;
import ManagedActionExecutor = api.managedaction.ManagedActionExecutor;
import ManagedActionState = api.managedaction.ManagedActionState;
import ActionsStateManager = api.ui.ActionsStateManager;

type ActionNames =
    'SAVE' |
    'DELETE' |
    'DUPLICATE' |
    'PREVIEW' |
    'PUBLISH' |
    'PUBLISH_TREE' |
    'CREATE_ISSUE' |
    'UNPUBLISH' |
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
    CLOSE?: boolean,
    SHOW_LIVE_EDIT?: boolean,
    SHOW_FORM?: boolean,
    SHOW_SPLIT_EDIT?: boolean,
    SAVE_AND_CLOSE?: boolean,
    PUBLISH_MOBILE?: boolean,
    UNDO_PENDING_DELETE?: boolean,
};

export class ContentWizardActions extends api.app.wizard.WizardActions<api.content.Content> {

    private deleteOnlyMode: boolean = false;

    private persistedContent: Content;

    private hasModifyPermission: boolean;

    private wizardPanel: ContentWizardPanel;

    private actionsMap: ActionsMap;

    private stateManager: ActionsStateManager;

    private hasUnsavedChanges: () => boolean;

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
            CLOSE: actions[8],
            SHOW_LIVE_EDIT: actions[9],
            SHOW_FORM: actions[10],
            SHOW_SPLIT_EDIT: actions[11],
            SAVE_AND_CLOSE: actions[12],
            PUBLISH_MOBILE: actions[13],
            UNDO_PENDING_DELETE: actions[14]
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
                this.stateManager.stashActions(stashableActionsMap, false);
            } else if (state === ManagedActionState.ENDED) {
                this.stateManager.unstashActions(stashableActionsMap);
            }
        });
    }

    setUnsavedChangesCallback(callback: () => boolean) {
        this.hasUnsavedChanges = callback;

        const checkSaveActionState = api.util.AppHelper.debounce(() => {
            let isEnabled = this.hasUnsavedChanges();
            if (this.persistedContent) {

                const overwritePermissions = this.wizardPanel.getSecurityWizardStepForm() &&
                                             this.wizardPanel.getSecurityWizardStepForm().isOverwritePermissions();

                isEnabled = (isEnabled || overwritePermissions) && this.persistedContent.isEditable() && this.hasModifyPermission;
            }
            this.enableActions({ SAVE: isEnabled });

            this.getSaveAction().setLabel(i18n(isEnabled || !this.getSaveAction().isSavedStateEnabled() ? 'action.save' : 'action.saved'));

        }, 100, false);

        this.wizardPanel.onPermissionItemsAdded(checkSaveActionState);
        this.wizardPanel.onPermissionItemsRemoved(checkSaveActionState);
        this.wizardPanel.onPermissionItemChanged(checkSaveActionState);
        this.wizardPanel.onDataChanged(checkSaveActionState);
        this.wizardPanel.onLiveModelChanged(checkSaveActionState);
    }

    private enableActions(state: ActionsState) {
        this.stateManager.enableActions(state);
    }

    private isActionEnabled(name: ActionNames) {
        return this.stateManager.isActionEnabled(name);
    }

    refreshPendingDeleteDecorations() {
        let compareStatus = this.wizardPanel.getCompareStatus();
        let isPendingDelete = api.content.CompareStatusChecker.isPendingDelete(compareStatus);

        this.actionsMap.UNDO_PENDING_DELETE.setVisible(isPendingDelete);
        this.actionsMap.SAVE.setVisible(!isPendingDelete);
        this.actionsMap.DELETE.setVisible(!isPendingDelete);
        this.actionsMap.DUPLICATE.setVisible(!isPendingDelete);
        this.actionsMap.UNPUBLISH.setVisible(!isPendingDelete);
        this.actionsMap.PREVIEW.setVisible(this.isActionEnabled('PREVIEW') && !isPendingDelete);
    }

    enableActionsForNew() {
        this.persistedContent = null;
        this.stateManager.enableActions({});
        this.enableActions({SAVE: false, DELETE: true});
    }

    enableActionsForExisting(existing: api.content.Content) {
        this.persistedContent = existing;

        this.enableActions({
            DELETE: existing.isDeletable()
        });

        this.enableActionsForExistingByPermissions(existing).then(() => {
            this.enableActions({
                SAVE: existing.isEditable() && this.hasUnsavedChanges()
            });
        });
    }

    setDeleteOnlyMode(content: api.content.Content, valueOn: boolean = true) {
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

    private enableDeleteIfAllowed(content: api.content.Content) {
        new api.security.auth.IsAuthenticatedRequest().sendAndParse().then((loginResult: api.security.auth.LoginResult) => {
            let hasDeletePermission = api.security.acl.PermissionHelper.hasPermission(api.security.acl.Permission.DELETE,
                loginResult, content.getPermissions());
            this.enableActions({DELETE: hasDeletePermission});
        });
    }

    private enableActionsForExistingByPermissions(existing: api.content.Content): wemQ.Promise<any> {
        return new api.security.auth.IsAuthenticatedRequest().sendAndParse().then((loginResult: api.security.auth.LoginResult) => {

            this.hasModifyPermission = api.security.acl.PermissionHelper.hasPermission(api.security.acl.Permission.MODIFY,
                loginResult, existing.getPermissions());
            let hasDeletePermission = api.security.acl.PermissionHelper.hasPermission(api.security.acl.Permission.DELETE,
                loginResult, existing.getPermissions());
            let hasPublishPermission = api.security.acl.PermissionHelper.hasPermission(api.security.acl.Permission.PUBLISH,
                loginResult, existing.getPermissions());

            if (!this.hasModifyPermission) {
                this.enableActions({SAVE: false, SAVE_AND_CLOSE: false});
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
                new api.content.resource.GetContentByPathRequest(existing.getPath().getParentPath()).sendAndParse().then(
                    (parent: api.content.Content) => {
                        new api.content.resource.GetContentPermissionsByIdRequest(parent.getContentId()).sendAndParse().then(
                            (accessControlList: api.security.acl.AccessControlList) => {
                                let hasParentCreatePermission = api.security.acl.PermissionHelper.hasPermission(
                                    api.security.acl.Permission.CREATE,
                                    loginResult,
                                    accessControlList);

                                if (!hasParentCreatePermission) {
                                    this.enableActions({DUPLICATE: false});
                                }
                            });
                    });
            } else {
                new api.content.resource.GetContentRootPermissionsRequest().sendAndParse().then(
                    (accessControlList: api.security.acl.AccessControlList) => {
                        let hasParentCreatePermission = api.security.acl.PermissionHelper.hasPermission(api.security.acl.Permission.CREATE,
                            loginResult,
                            accessControlList);

                        if (!hasParentCreatePermission) {
                            this.enableActions({DUPLICATE: false});
                        }
                    });
            }

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

    getPublishAction(): Action {
        return this.actionsMap.PUBLISH;
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
