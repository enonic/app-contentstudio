import {ContentTreeGrid} from '../ContentTreeGrid';
import {ToggleSearchPanelAction} from './ToggleSearchPanelAction';
import {ShowNewContentDialogAction} from './ShowNewContentDialogAction';
import {PreviewContentAction} from './PreviewContentAction';
import {EditContentAction} from './EditContentAction';
import {DeleteContentAction} from './DeleteContentAction';
import {DuplicateContentAction} from './DuplicateContentAction';
import {MoveContentAction} from './MoveContentAction';
import {SortContentAction} from './SortContentAction';
import {PublishContentAction} from './PublishContentAction';
import {PublishTreeContentAction} from './PublishTreeContentAction';
import {UnpublishContentAction} from './UnpublishContentAction';
import {ContentBrowseItem} from '../ContentBrowseItem';
import {PreviewContentHandler} from './handler/PreviewContentHandler';
import {UndoPendingDeleteContentAction} from './UndoPendingDeleteContentAction';
import {CreateIssueAction} from './CreateIssueAction';
import {GetPermittedActionsRequest} from '../../resource/GetPermittedActionsRequest';
import {GetContentTypeByNameRequest} from '../../resource/GetContentTypeByNameRequest';
import {GetContentByPathRequest} from '../../resource/GetContentByPathRequest';
import {Content} from '../../content/Content';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentType} from '../../inputtype/schema/ContentType';
import {Permission} from '../../access/Permission';
import {HasUnpublishedChildrenRequest} from '../../resource/HasUnpublishedChildrenRequest';
import {HasUnpublishedChildren, HasUnpublishedChildrenResult} from '../../resource/HasUnpublishedChildrenResult';
import {MarkAsReadyContentAction} from './MarkAsReadyContentAction';
import {RequestPublishContentAction} from './RequestPublishContentAction';
import ContentId = api.content.ContentId;
import Action = api.ui.Action;
import ActionsStateManager = api.ui.ActionsStateManager;
import TreeGridActions = api.ui.treegrid.actions.TreeGridActions;
import BrowseItemsChanges = api.app.browse.BrowseItemsChanges;
import ContentSummary = api.content.ContentSummary;
import i18n = api.util.i18n;
import ManagedActionManager = api.managedaction.ManagedActionManager;
import ManagedActionState = api.managedaction.ManagedActionState;
import ManagedActionExecutor = api.managedaction.ManagedActionExecutor;

type ActionsMap = {
    SHOW_NEW_DIALOG?: Action,
    PREVIEW?: Action,
    EDIT?: Action,
    DELETE?: Action,
    DUPLICATE?: Action,
    MOVE?: Action,
    SORT?: Action,
    PUBLISH?: Action,
    PUBLISH_TREE?: Action,
    UNPUBLISH?: Action,
    MARK_AS_READY?: Action,
    REQUEST_PUBLISH?: Action,
    CREATE_ISSUE?: Action,
    TOGGLE_SEARCH_PANEL?: Action,
    UNDO_PENDING_DELETE?: Action,
};

type ActionsState = {
    SHOW_NEW_DIALOG?: boolean,
    PREVIEW?: boolean,
    EDIT?: boolean,
    DELETE?: boolean,
    DUPLICATE?: boolean,
    MOVE?: boolean,
    SORT?: boolean,
    PUBLISH?: boolean,
    PUBLISH_TREE?: boolean,
    UNPUBLISH?: boolean,
    MARK_AS_READY?: boolean,
    REQUEST_PUBLISH?: boolean,
    CREATE_ISSUE?: boolean,
    TOGGLE_SEARCH_PANEL?: boolean,
    UNDO_PENDING_DELETE?: boolean
};

export class ContentTreeGridActions implements TreeGridActions<ContentSummaryAndCompareStatus> {

    private grid: ContentTreeGrid;

    private actionsMap: ActionsMap;

    private stateManager: ActionsStateManager;

    private beforeActionsStashedListeners: { (): void; }[] = [];

    private actionsUnstashedListeners: { (): void; }[] = [];

    constructor(grid: ContentTreeGrid) {
        this.grid = grid;

        this.actionsMap = {
            SHOW_NEW_DIALOG: new ShowNewContentDialogAction(grid),
            PREVIEW: new PreviewContentAction(grid),
            EDIT: new EditContentAction(grid),
            DELETE: new DeleteContentAction(grid),
            DUPLICATE: new DuplicateContentAction(grid),
            MOVE: new MoveContentAction(grid),
            SORT: new SortContentAction(grid),
            PUBLISH: new PublishContentAction(grid),
            PUBLISH_TREE: new PublishTreeContentAction(grid),
            UNPUBLISH: new UnpublishContentAction(grid),
            MARK_AS_READY: new MarkAsReadyContentAction(grid),
            REQUEST_PUBLISH: new RequestPublishContentAction(grid),
            CREATE_ISSUE: new CreateIssueAction(grid),
            TOGGLE_SEARCH_PANEL: new ToggleSearchPanelAction(),
            UNDO_PENDING_DELETE: new UndoPendingDeleteContentAction(grid)
        };

        this.stateManager = new ActionsStateManager(this.actionsMap);

        this.initListeners();
    }

    initListeners() {
        const stashableActionsMap: ActionsMap = {
            PREVIEW: this.actionsMap.PREVIEW,
            EDIT: this.actionsMap.EDIT,
            DELETE: this.actionsMap.DELETE,
            DUPLICATE: this.actionsMap.DUPLICATE,
            MOVE: this.actionsMap.MOVE,
            SORT: this.actionsMap.SORT,
            PUBLISH: this.actionsMap.PUBLISH,
            PUBLISH_TREE: this.actionsMap.PUBLISH_TREE,
            UNPUBLISH: this.actionsMap.UNPUBLISH,
            MARK_AS_READY: this.actionsMap.MARK_AS_READY,
            REQUEST_PUBLISH: this.actionsMap.REQUEST_PUBLISH,
            CREATE_ISSUE: this.actionsMap.CREATE_ISSUE,
            UNDO_PENDING_DELETE: this.actionsMap.UNDO_PENDING_DELETE
        };

        const previewStateChangedHandler = value => {
            this.enableActions({PREVIEW: value});
        };

        this.getPreviewHandler().onPreviewStateChanged(previewStateChangedHandler);

        const managedActionsHandler = (state: ManagedActionState, executor: ManagedActionExecutor) => {
            if (state === ManagedActionState.PREPARING) {
                this.notifyBeforeActionsStashed();
                this.stateManager.stashActions(stashableActionsMap, false);
            } else if (state === ManagedActionState.ENDED) {
                this.stateManager.unstashActions(stashableActionsMap);
                this.notifyActionsUnstashed();
            }
        };

        ManagedActionManager.instance().onManagedActionStateChanged(managedActionsHandler);

        this.grid.onRemoved(() => {
            this.getPreviewHandler().unPreviewStateChanged(previewStateChangedHandler);
            ManagedActionManager.instance().unManagedActionStateChanged(managedActionsHandler);
        });
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

    private enableActions(state: ActionsState) {
        this.stateManager.enableActions(state);
    }

    getPreviewHandler(): PreviewContentHandler {
        return (<PreviewContentAction>this.actionsMap.PREVIEW).getPreviewHandler();
    }

    getAllCommonActions(): api.ui.Action[] {
        return [
            this.actionsMap.SHOW_NEW_DIALOG,
            this.actionsMap.EDIT,
            this.actionsMap.DELETE,
            this.actionsMap.DUPLICATE,
            this.actionsMap.MOVE,
            this.actionsMap.SORT,
            this.actionsMap.PREVIEW
        ];
    }

    getPublishActions(): api.ui.Action[] {
        return [
            this.actionsMap.PUBLISH,
            this.actionsMap.UNPUBLISH
        ];
    }

    getPendingDeleteActions(): api.ui.Action[] {
        return [
            this.actionsMap.UNDO_PENDING_DELETE
        ];
    }

    getAllActionsNoPublish(): api.ui.Action[] {
        return [
            ...this.getAllCommonActions(),
            ...this.getPendingDeleteActions()
        ];
    }

    getAllActionsNoPendingDelete(): api.ui.Action[] {
        return [
            ...this.getAllCommonActions(),
            this.actionsMap.UNPUBLISH
        ];
    }

    getAllActions(): api.ui.Action[] {
        return [
            ...this.getAllActionsNoPublish(),
            ...this.getPublishActions()
        ];
    }

    // tslint:disable-next-line:max-line-length
    updateActionsEnabledState(browseItems: ContentBrowseItem[], changes?: BrowseItemsChanges<ContentSummaryAndCompareStatus>): wemQ.Promise<void> {

        if (changes && changes.getAdded().length === 0 && changes.getRemoved().length === 0) {
            return wemQ<void>(null);
        }

        this.actionsMap.TOGGLE_SEARCH_PANEL.setVisible(false);

        let parallelPromises: wemQ.Promise<any>[] = [
            this.getPreviewHandler().updateState(browseItems, changes),
            this.doUpdateActionsEnabledState(browseItems)
        ];

        return wemQ.all(parallelPromises).catch(api.DefaultErrorHandler.handle);
    }

    private resetDefaultActionsNoItemsSelected() {
        this.enableActions({
            SHOW_NEW_DIALOG: true,
            EDIT: false,
            DELETE: false,
            DUPLICATE: false,
            MOVE: false,
            SORT: false,
            PUBLISH_TREE: false,
            PUBLISH: false,
            UNPUBLISH: false,
            MARK_AS_READY: false,
            REQUEST_PUBLISH: false,
            CREATE_ISSUE: true,
        });

        this.actionsMap.UNPUBLISH.setVisible(false);
        this.actionsMap.UNDO_PENDING_DELETE.setVisible(false);

        this.showDefaultActions();
    }

    private showDefaultActions() {
        const defaultActions = [
            this.actionsMap.SHOW_NEW_DIALOG,
            this.actionsMap.EDIT,
            this.actionsMap.DELETE,
            this.actionsMap.DUPLICATE,
            this.actionsMap.MOVE,
            this.actionsMap.SORT,
            this.actionsMap.PREVIEW,
            this.actionsMap.PUBLISH
        ];
        defaultActions.forEach(action => action.setVisible(true));
    }

    private resetDefaultActionsMultipleItemsSelected(contentBrowseItems: ContentBrowseItem[]) {
        const contentSummaries: ContentSummary[] = contentBrowseItems.map((elem: ContentBrowseItem) => {
            return elem.getModel().getContentSummary();
        });

        const noManagedActionExecuting: boolean = !ManagedActionManager.instance().isExecuting();

        let treePublishEnabled: boolean = true;
        let unpublishEnabled: boolean = true;

        const deleteEnabled: boolean = this.anyDeletable(contentSummaries) && noManagedActionExecuting;
        const duplicateEnabled: boolean = contentSummaries.length >= 1 && noManagedActionExecuting;
        const moveEnabled: boolean = !this.isAllItemsSelected(contentBrowseItems.length) && noManagedActionExecuting;
        const markAsReadyEnabled: boolean = this.isMarkAsReadyHasToBeEnabled(contentBrowseItems);
        const requestPublishEnabled: boolean = this.isRequestPublishHasToBeEnabled(contentBrowseItems);

        let allAreOnline: boolean = contentBrowseItems.length > 0;
        let allArePendingDelete: boolean = contentBrowseItems.length > 0;
        let anyIsPendingDelete: boolean = false;
        let someArePublished: boolean = false;
        let allAreReadonly: boolean = contentBrowseItems.length > 0;
        const isMultipleOrValid: boolean = contentSummaries.length > 1 || (contentSummaries.length === 1 && contentSummaries[0].isValid());

        contentBrowseItems.forEach((browseItem) => {
            const content: ContentSummaryAndCompareStatus = browseItem.getModel();

            if (allAreOnline && !content.isOnline()) {
                allAreOnline = false;
            }
            if (allArePendingDelete && !content.isPendingDelete()) {
                allArePendingDelete = false;
            }
            if (content.isPendingDelete()) {
                anyIsPendingDelete = true;
            }
            if (!someArePublished && content.isPublished()) {
                someArePublished = true;
            }
            if (allAreReadonly && !content.isReadOnly()) {
                allAreReadonly = false;
            }
        });

        const publishEnabled: boolean = !allAreOnline && noManagedActionExecuting && isMultipleOrValid;
        if (this.isEveryLeaf(contentSummaries)) {
            treePublishEnabled = false;
            unpublishEnabled = someArePublished;
        } else if (this.isOneNonLeaf(contentSummaries)) {
            unpublishEnabled = someArePublished;
        } else if (this.isNonLeafInMany(contentSummaries)) {
            unpublishEnabled = someArePublished;
        }

        treePublishEnabled = treePublishEnabled && noManagedActionExecuting;
        unpublishEnabled = unpublishEnabled && noManagedActionExecuting;

        this.enableActions({
            SHOW_NEW_DIALOG: contentSummaries.length < 2,
            EDIT: !allAreReadonly && this.anyEditable(contentSummaries),
            DELETE: deleteEnabled,
            DUPLICATE: duplicateEnabled,
            MOVE: moveEnabled,
            SORT: contentSummaries.length === 1 && contentSummaries[0].hasChildren(),
            PUBLISH: publishEnabled,
            PUBLISH_TREE: treePublishEnabled,
            UNPUBLISH: unpublishEnabled,
            MARK_AS_READY: markAsReadyEnabled,
            REQUEST_PUBLISH: requestPublishEnabled,
            CREATE_ISSUE: true
        });

        if (anyIsPendingDelete) {
            const invisibleActions: Action[] = allArePendingDelete ? this.getAllActionsNoPendingDelete() : this.getAllActions();
            invisibleActions.forEach(action => action.setVisible(false));

            this.actionsMap.PUBLISH.setVisible(allArePendingDelete || publishEnabled);

            this.enableActions({
                PUBLISH_TREE: false,
                UNPUBLISH: allArePendingDelete || publishEnabled,
                PUBLISH: allArePendingDelete || publishEnabled
            });

        } else {
            this.getAllCommonActions().forEach(action => action.setVisible(true));

            this.actionsMap.UNPUBLISH.setVisible(unpublishEnabled);
            this.actionsMap.PUBLISH.setVisible(publishEnabled);
        }

        this.getPendingDeleteActions().forEach((action) => action.setVisible(allArePendingDelete));
    }

    private isEveryLeaf(contentSummaries: ContentSummary[]): boolean {
        return contentSummaries.every((obj: ContentSummary) => !obj.hasChildren());
    }

    private isOneNonLeaf(contentSummaries: ContentSummary[]): boolean {
        return contentSummaries.length === 1 && contentSummaries[0].hasChildren();
    }

    private isNonLeafInMany(contentSummaries: ContentSummary[]): boolean {
        return contentSummaries.length > 1 && contentSummaries.some((obj: ContentSummary) => obj.hasChildren());
    }

    private doUpdateActionsEnabledState(contentBrowseItems: ContentBrowseItem[]): wemQ.Promise<any> {
        switch (contentBrowseItems.length) {
        case 0:
            return this.updateActionsByPermissionsNoItemsSelected();
        case 1:
            return this.updateActionsByPermissionsSingleItemSelected(contentBrowseItems);
        default:
            return this.updateActionsByPermissionsMultipleItemsSelected(contentBrowseItems);
        }
    }

    private updateActionsByPermissionsNoItemsSelected(): wemQ.Promise<any> {
        return new GetPermittedActionsRequest().addPermissionsToBeChecked(Permission.CREATE).sendAndParse().then(
            (allowedPermissions: Permission[]) => {
                this.resetDefaultActionsNoItemsSelected();
                this.enableActions({SHOW_NEW_DIALOG: this.canCreate(allowedPermissions)});
            });
    }

    private updateActionsByPermissionsSingleItemSelected(contentBrowseItems: ContentBrowseItem[]): wemQ.Promise<any> {
        const selectedItem: ContentSummaryAndCompareStatus = contentBrowseItems[0].getModel();

        return this.checkIsChildrenAllowedByContentType(selectedItem).then((contentTypeAllowsChildren: boolean) => {
            return this.updateActionsByPermissionsMultipleItemsSelected(contentBrowseItems, contentTypeAllowsChildren).then(() => {
                return this.updateCanDuplicateActionSingleItemSelected(selectedItem.getContentSummary());
            });
        });
    }

    private handleContentTypeNotFound(selectedItem: ContentSummaryAndCompareStatus): wemQ.Promise<any> {
        api.notify.NotifyManager.get().showWarning(
            i18n('notify.contentType.notFound', selectedItem.getContentSummary().getType().getLocalName()));

        return this.getCreateDeletePublishAllowed([selectedItem.getContentId()]).then((allowedPermissions: Permission[]) => {
            this.resetDefaultActionsNoItemsSelected();
            this.enableActions({SHOW_NEW_DIALOG: false});
            this.updateDefaultActionsNoItemsSelected(selectedItem, allowedPermissions);
        });
    }

    private getCreateDeletePublishAllowed(contentIds: ContentId[]): wemQ.Promise<Permission[]> {
        return new GetPermittedActionsRequest().addContentIds(...contentIds).addPermissionsToBeChecked(
            Permission.CREATE, Permission.DELETE, Permission.PUBLISH).sendAndParse();
    }

    private canCreate(allowedPermissions: Permission[]): boolean {
        return allowedPermissions.indexOf(Permission.CREATE) > -1;
    }

    private canDelete(allowedPermissions: Permission[]): boolean {
        return allowedPermissions.indexOf(Permission.DELETE) > -1 && !ManagedActionManager.instance().isExecuting();
    }

    private canPublish(allowedPermissions: Permission[]): boolean {
        return allowedPermissions.indexOf(Permission.PUBLISH) > -1 && !ManagedActionManager.instance().isExecuting();
    }

    private updateDefaultActionsNoItemsSelected(selectedItem: ContentSummaryAndCompareStatus, allowedPermissions: Permission[]) {
        const canDelete: boolean = this.canDelete(allowedPermissions);

        if (canDelete) {
            this.enableActions({DELETE: true});
        }

        if (this.canCreate(allowedPermissions) && canDelete) {
            this.enableActions({MOVE: true});
        }

        if (this.canPublish(allowedPermissions)) {
            if (selectedItem.isPublished()) {
                this.enableActions({UNPUBLISH: true});
            } else {
                this.enableActions({PUBLISH: true});
            }
        }
    }

    private updateActionsByPermissionsMultipleItemsSelected(contentBrowseItems: ContentBrowseItem[],
                                                            contentTypesAllowChildren: boolean = true): wemQ.Promise<any> {
        const contentIds: ContentId[] = contentBrowseItems.map(contentBrowseItem => contentBrowseItem.getModel().getContentId());

        return this.getCreateDeletePublishAllowed(contentIds).then((allowedPermissions: Permission[]) => {
            this.resetDefaultActionsMultipleItemsSelected(contentBrowseItems);
            this.updateDefaultActionsMultipleItemsSelected(contentIds, allowedPermissions, contentTypesAllowChildren);
        });
    }

    private updateDefaultActionsMultipleItemsSelected(contentIds: ContentId[], allowedPermissions: Permission[],
                                                      contentTypesAllowChildren: boolean = true) {
        if (!contentTypesAllowChildren || !this.canCreate(allowedPermissions)) {
            this.enableActions({
                SHOW_NEW_DIALOG: false,
                SORT: false
            });
        }

        if (!this.canDelete(allowedPermissions)) {
            this.enableActions({
                DELETE: false,
                MOVE: false
            });
        }

        if (!this.canPublish(allowedPermissions)) {
            this.enableActions({
                PUBLISH: false,
                PUBLISH_TREE: false,
                UNPUBLISH: false
            });
        } else {
            this.updatePublishTreeAction(contentIds);
        }
    }

    private updatePublishTreeAction(contentIds: ContentId[]) {
        const hasUnpublishedChildrenPromise: wemQ.Promise<HasUnpublishedChildrenResult> =
            new HasUnpublishedChildrenRequest(contentIds).sendAndParse();

        hasUnpublishedChildrenPromise.then((hasUnpublishedChildrenResult: HasUnpublishedChildrenResult) => {
                const hasUnpublishedChildren: boolean =
                    hasUnpublishedChildrenResult.getResult().some((item: HasUnpublishedChildren) => item.getHasChildren());

                this.enableActions({
                    PUBLISH_TREE: hasUnpublishedChildren
                });
            }).catch(reason => api.DefaultErrorHandler.handle(reason));
    }

    private checkIsChildrenAllowedByContentType(selectedItem: ContentSummaryAndCompareStatus): wemQ.Promise<Boolean> {
        const deferred = wemQ.defer<boolean>();

        new GetContentTypeByNameRequest(selectedItem.getContentSummary().getType()).sendAndParse()
            .then((contentType: ContentType) => deferred.resolve(contentType && contentType.isAllowChildContent()))
            .fail(() => this.handleContentTypeNotFound(selectedItem));

        return deferred.promise;
    }

    private anyEditable(contentSummaries: api.content.ContentSummary[]): boolean {
        return contentSummaries.some((content) => {
            return !!content && content.isEditable();
        });
    }

    private anyDeletable(contentSummaries: api.content.ContentSummary[]): boolean {
        return contentSummaries.some((content) => {
            return !!content && content.isDeletable();
        });
    }

    private isMarkAsReadyHasToBeEnabled(contentBrowseItems: ContentBrowseItem[]): boolean {
        const items: ContentSummaryAndCompareStatus[] = contentBrowseItems.map(item => item.getModel());

        const allValid: boolean = items.every(item => item.getContentSummary().isValid());
        if (!allValid) {
            return false;
        }

        return items.some(item => (!item.isOnline() && !item.getContentSummary().isReady()));
    }

    private isRequestPublishHasToBeEnabled(contentBrowseItems: ContentBrowseItem[]): boolean {
        const items: ContentSummaryAndCompareStatus[] = contentBrowseItems.map(item => item.getModel());

        const allValid: boolean = items.every(item => item.getContentSummary().isValid());
        if (!allValid) {
            return false;
        }

        return items.some(item => (!item.isOnline() && !item.getContentSummary().isInProgress()));
    }

    private updateCanDuplicateActionSingleItemSelected(selectedItem: ContentSummary): wemQ.Promise<void> {
        // Need to check if parent allows content creation
        return new GetContentByPathRequest(selectedItem.getPath().getParentPath()).sendAndParse().then((content: Content) =>
            new GetPermittedActionsRequest()
                .addContentIds(content.getContentId())
                .addPermissionsToBeChecked(Permission.CREATE)
                .sendAndParse().then((allowedPermissions: Permission[]) => {
                const canDuplicate = allowedPermissions.indexOf(Permission.CREATE) > -1 &&
                                     !ManagedActionManager.instance().isExecuting();
                this.enableActions({DUPLICATE: canDuplicate});
            }));
    }

    private isAllItemsSelected(items: number): boolean {
        return items === this.grid.getRoot().getDefaultRoot().treeToList(false, false).length;
    }

    getDeleteAction(): Action {
        return this.actionsMap.DELETE;
    }

    getDuplicateAction(): Action {
        return this.actionsMap.DUPLICATE;
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

    getMoveAction(): Action {
        return this.actionsMap.MOVE;
    }

    getSortAction(): Action {
        return this.actionsMap.SORT;
    }

    getEditAction(): Action {
        return this.actionsMap.EDIT;
    }

    getShowNewDialogAction(): Action {
        return this.actionsMap.SHOW_NEW_DIALOG;
    }

    getMarkAsReadyAction(): Action {
        return this.actionsMap.MARK_AS_READY;
    }

    getRequestPublishAction(): Action {
        return this.actionsMap.REQUEST_PUBLISH;
    }

    getToggleSearchPanelAction(): Action {
        return this.actionsMap.TOGGLE_SEARCH_PANEL;
    }

    getUndoPendingDeleteAction(): Action {
        return this.actionsMap.UNDO_PENDING_DELETE;
    }
}
