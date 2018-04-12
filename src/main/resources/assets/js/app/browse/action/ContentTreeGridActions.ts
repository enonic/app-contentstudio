import '../../../api.ts';
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
import Action = api.ui.Action;
import ActionsStateManager = api.ui.ActionsStateManager;
import TreeGridActions = api.ui.treegrid.actions.TreeGridActions;
import BrowseItemsChanges = api.app.browse.BrowseItemsChanges;
import ContentSummary = api.content.ContentSummary;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import Content = api.content.Content;
import Permission = api.security.acl.Permission;
import GetContentByPathRequest = api.content.resource.GetContentByPathRequest;
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
    CREATE_ISSUE?: boolean,
    TOGGLE_SEARCH_PANEL?: boolean,
    UNDO_PENDING_DELETE?: boolean
};

export class ContentTreeGridActions implements TreeGridActions<ContentSummaryAndCompareStatus> {

    private grid: ContentTreeGrid;

    private actionsMap: ActionsMap;

    private stateManager: ActionsStateManager;

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
            CREATE_ISSUE: this.actionsMap.CREATE_ISSUE,
            UNDO_PENDING_DELETE: this.actionsMap.UNDO_PENDING_DELETE
        };

        const previewStateChangedHandler = value => {
            this.enableActions({PREVIEW: value});
        };

        this.getPreviewHandler().onPreviewStateChanged(previewStateChangedHandler);

        const managedActionsHandler = (state: ManagedActionState, executor: ManagedActionExecutor) => {
            if (state === ManagedActionState.PREPARING) {
                this.stateManager.stashActions(stashableActionsMap, false);
            } else if (state === ManagedActionState.ENDED) {
                this.stateManager.unstashActions(stashableActionsMap);
            }
        };

        ManagedActionManager.instance().onManagedActionStateChanged(managedActionsHandler);

        this.grid.onRemoved(() => {
            this.getPreviewHandler().unPreviewStateChanged(previewStateChangedHandler);
            ManagedActionManager.instance().unManagedActionStateChanged(managedActionsHandler);
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

        if (changes && changes.getAdded().length == 0 && changes.getRemoved().length == 0) {
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
            CREATE_ISSUE: false,
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
        let contentSummaries: ContentSummary[] = contentBrowseItems.map((elem: ContentBrowseItem) => {
            return elem.getModel().getContentSummary();
        });

        const noManagedActionExecuting = !ManagedActionManager.instance().isExecuting();

        let treePublishEnabled = true;
        let unpublishEnabled = true;

        const deleteEnabled = this.anyDeletable(contentSummaries) && noManagedActionExecuting;
        const duplicateEnabled = contentSummaries.length >= 1 && noManagedActionExecuting;
        const moveEnabled = !this.isAllItemsSelected(contentBrowseItems.length) && noManagedActionExecuting;

        let allAreOnline = contentBrowseItems.length > 0;
        let allArePendingDelete = contentBrowseItems.length > 0;
        let anyIsPendingDelete = false;
        let someArePublished = false;
        let allAreReadonly = contentBrowseItems.length > 0;

        contentBrowseItems.forEach((browseItem) => {
            let content = browseItem.getModel();

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

        const publishEnabled = !allAreOnline && noManagedActionExecuting;
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
            CREATE_ISSUE: true
        });

        if (anyIsPendingDelete) {
            const invisibleActions = allArePendingDelete ? this.getAllActionsNoPendingDelete() : this.getAllActions();
            invisibleActions.forEach(action => action.setVisible(false));

            this.actionsMap.PUBLISH.setVisible(allArePendingDelete || publishEnabled);

            this.enableActions({
                PUBLISH_TREE: false,
                UNPUBLISH: false,
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
        return new api.content.resource.GetPermittedActionsRequest().addPermissionsToBeChecked(Permission.CREATE).sendAndParse().then(
            (allowedPermissions: Permission[]) => {
                this.resetDefaultActionsNoItemsSelected();

                const canCreate = allowedPermissions.indexOf(Permission.CREATE) > -1;

                this.enableActions({SHOW_NEW_DIALOG: canCreate});
            });
    }

    private updateActionsByPermissionsSingleItemSelected(contentBrowseItems: ContentBrowseItem[]): wemQ.Promise<any> {
        let selectedItem = contentBrowseItems[0].getModel().getContentSummary();

        return this.checkIsChildrenAllowedByContentType(selectedItem).then((contentTypeAllowsChildren: boolean) => {
            return this.updateActionsByPermissionsMultipleItemsSelected(contentBrowseItems, contentTypeAllowsChildren).then(() => {
                return this.updateCanDuplicateActionSingleItemSelected(selectedItem);
            });
        });
    }

    private handleDeletedContentType(contentSummary: ContentSummary): wemQ.Promise<any> {
        api.notify.NotifyManager.get().showWarning(i18n('notify.contentType.notFound', contentSummary.getType().getLocalName()));

        return new api.content.resource.GetPermittedActionsRequest().addContentIds(contentSummary.getContentId()).addPermissionsToBeChecked(
            Permission.CREATE, Permission.DELETE, Permission.PUBLISH).sendAndParse().then((allowedPermissions: Permission[]) => {
            this.resetDefaultActionsNoItemsSelected();
            this.enableActions({SHOW_NEW_DIALOG: false});

            const canCreate = allowedPermissions.indexOf(Permission.CREATE) > -1;

            const canDelete = allowedPermissions.indexOf(Permission.DELETE) > -1 && !ManagedActionManager.instance().isExecuting();

            const canPublish = allowedPermissions.indexOf(Permission.PUBLISH) > -1 && !ManagedActionManager.instance().isExecuting();

            if (canDelete) {
                this.enableActions({DELETE: true});
            }

            if (canCreate && canDelete) {
                this.enableActions({MOVE: true});
            }

            if (canPublish) {
                this.enableActions({UNPUBLISH: true});
            }
        });
    }

    private updateActionsByPermissionsMultipleItemsSelected(contentBrowseItems: ContentBrowseItem[],
                                                            contentTypesAllowChildren: boolean = true): wemQ.Promise<any> {
        return new api.content.resource.GetPermittedActionsRequest().addContentIds(
            ...contentBrowseItems.map(contentBrowseItem => contentBrowseItem.getModel().getContentId())).addPermissionsToBeChecked(
            Permission.CREATE, Permission.DELETE, Permission.PUBLISH).sendAndParse().then((allowedPermissions: Permission[]) => {
            this.resetDefaultActionsMultipleItemsSelected(contentBrowseItems);

            let canCreate = allowedPermissions.indexOf(Permission.CREATE) > -1;

            let canDelete = allowedPermissions.indexOf(Permission.DELETE) > -1 && !ManagedActionManager.instance().isExecuting();

            let canPublish = allowedPermissions.indexOf(Permission.PUBLISH) > -1 && !ManagedActionManager.instance().isExecuting();

            if (!contentTypesAllowChildren || !canCreate) {
                this.enableActions({
                    SHOW_NEW_DIALOG: false,
                    SORT: false
                });
            }

            if (!canDelete) {
                this.enableActions({
                    DELETE: false,
                    MOVE: false
                });
            }

            if (!canPublish) {
                this.enableActions({
                    PUBLISH: false,
                    PUBLISH_TREE: false,
                    UNPUBLISH: false
                });
            }
        });
    }

    private checkIsChildrenAllowedByContentType(contentSummary: ContentSummary): wemQ.Promise<Boolean> {
        let deferred = wemQ.defer<boolean>();

        new api.schema.content.GetContentTypeByNameRequest(contentSummary.getType()).sendAndParse()
            .then((contentType: api.schema.content.ContentType) => deferred.resolve(contentType && contentType.isAllowChildContent()))
            .fail(() => this.handleDeletedContentType(contentSummary));

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

    private updateCanDuplicateActionSingleItemSelected(selectedItem: ContentSummary) {
        // Need to check if parent allows content creation
        new GetContentByPathRequest(selectedItem.getPath().getParentPath()).sendAndParse().then((content: Content) => {
            new api.content.resource.GetPermittedActionsRequest()
                .addContentIds(content.getContentId())
                .addPermissionsToBeChecked(Permission.CREATE)
                .sendAndParse().then((allowedPermissions: Permission[]) => {
                const canDuplicate = allowedPermissions.indexOf(Permission.CREATE) > -1 &&
                                     !ManagedActionManager.instance().isExecuting();
                this.enableActions({DUPLICATE: canDuplicate});
            });
        });
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

    getToggleSearchPanelAction(): Action {
        return this.actionsMap.TOGGLE_SEARCH_PANEL;
    }

    getUndoPendingDeleteAction(): Action {
        return this.actionsMap.UNDO_PENDING_DELETE;
    }
}
