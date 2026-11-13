import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { type AccessControlList } from '../../access/AccessControlList';
import { type Content } from '../../content/Content';
import { type ContentSummaryAndCompareStatus } from '../../content/ContentSummaryAndCompareStatus';
import { Permission } from '../../access/Permission';
import { isOnline, isPublished } from '../../../v6/shared/lib/cms/content/status';
import {
    $wizardActionEnvironment,
    $wizardActionFacts,
    needsUnpublishedChildrenCheck,
    patchWizardActionFacts,
    resetWizardActionFacts,
    setWizardActionsStashed,
    setWizardCanRequestPublish,
} from '../../../v6/pages/wizard/model/wizardActions.store';
import { registerWizardController } from '../../../v6/pages/wizard/model/wizardController';
import {
    refreshWizardPublishRequest,
    start as startPublishRequestService,
    stop as stopPublishRequestService,
} from '../../../v6/pages/wizard/model/wizardPublishRequest.service';
import { CloseAction } from '@enonic/lib-admin-ui/app/wizard/CloseAction';
import { WizardActions } from '@enonic/lib-admin-ui/app/wizard/WizardActions';
import { type ManagedActionExecutor } from '@enonic/lib-admin-ui/managedaction/ManagedActionExecutor';
import { ManagedActionManager } from '@enonic/lib-admin-ui/managedaction/ManagedActionManager';
import { ManagedActionState } from '@enonic/lib-admin-ui/managedaction/ManagedActionState';
import { type Action } from '@enonic/lib-admin-ui/ui/Action';
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
import { PreviewAction } from './PreviewAction';
import { ShowFormAction } from './ShowFormAction';
import { ShowLiveEditAction } from './ShowLiveEditAction';

//
// What is left of the legacy wizard actions. The state of the actions lives in
// `wizardActions.store` and they run through `wizardActions.commands`; this class
// writes the facts the store derives the state from, and keeps the few `Action`
// objects the live edit, the layout and lib-admin-ui `WizardPanel` still use.
//
export class ContentWizardActions extends WizardActions<Content> {
    private content: ContentSummaryAndCompareStatus;

    private wizardPanel: ContentWizardPanel;

    private previewAction: PreviewAction;

    private closeAction: Action;

    private showLiveEditAction: Action;

    private showFormAction: Action;

    private unsubscribers: (() => void)[] = [];

    private parentPermissionRequestId: number = 0;

    private unpublishedChildrenRequestId: number = 0;

    private hasCheckedUnpublishedChildren: boolean = false;

    constructor(wizardPanel: ContentWizardPanel) {
        const previewAction = new PreviewAction(wizardPanel);
        const closeAction = new CloseAction(wizardPanel);
        const showLiveEditAction = new ShowLiveEditAction(wizardPanel);
        const showFormAction = new ShowFormAction(wizardPanel);

        super(previewAction, closeAction, showLiveEditAction, showFormAction);

        this.wizardPanel = wizardPanel;
        this.previewAction = previewAction;
        this.closeAction = closeAction;
        this.showLiveEditAction = showLiveEditAction;
        this.showFormAction = showFormAction;

        ManagedActionManager.instance().onManagedActionStateChanged(
            (state: ManagedActionState, _executor: ManagedActionExecutor) => {
                if (state === ManagedActionState.PREPARING) {
                    setWizardActionsStashed(true);
                } else if (state === ManagedActionState.ENDED) {
                    setWizardActionsStashed(false);
                }
            },
        );

        resetWizardActionFacts();
        this.initStoreListeners();
    }

    private registerController(): () => void {
        return registerWizardController({
            getPersistedContent: () => this.wizardPanel.getPersistedItem() ?? undefined,
            hasUnsavedChanges: () => this.wizardPanel.hasUnsavedChanges(),
            save: (options) =>
                new Promise((resolve, reject) => {
                    this.wizardPanel.saveChanges(options).then((content) => resolve(content ?? undefined), reject);
                }),
            close: () => this.wizardPanel.close(true),
            replaceContent: (content, editable) => {
                this.wizardPanel.replacePersistedContent(content);
                this.setContent(this.wizardPanel.getContent()).refreshState();
                this.wizardPanel.setEnabled(editable);

                return Promise.resolve(this.refreshActions());
            },
            openTranslator: (language) => this.wizardPanel.openTranslatorDialog(language),
        });
    }

    private initStoreListeners() {
        this.cleanupUnsavedChangesListeners();

        startPublishRequestService();

        this.unsubscribers = [
            stopPublishRequestService,
            this.registerController(),
            $wizardActionFacts.listen(() => this.checkUnpublishedChildren()),
            $wizardActionEnvironment.listen(() => this.checkUnpublishedChildren()),
        ];
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
        refreshWizardPublishRequest(content.getContentId().toString());

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

    getPreviewAction(): Action {
        return this.previewAction;
    }

    getCloseAction(): Action {
        return this.closeAction;
    }

    getShowLiveEditAction(): Action {
        return this.showLiveEditAction;
    }

    getShowFormAction(): Action {
        return this.showFormAction;
    }
}
