import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentId} from 'lib-admin-ui/content/ContentId';
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
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentType} from '../../inputtype/schema/ContentType';
import {Permission} from '../../access/Permission';
import {HasUnpublishedChildrenRequest} from '../../resource/HasUnpublishedChildrenRequest';
import {HasUnpublishedChildren, HasUnpublishedChildrenResult} from '../../resource/HasUnpublishedChildrenResult';
import {RequestPublishContentAction} from './RequestPublishContentAction';
import {Action} from 'lib-admin-ui/ui/Action';
import {TreeGridActions} from 'lib-admin-ui/ui/treegrid/actions/TreeGridActions';
import {BrowseItemsChanges} from 'lib-admin-ui/app/browse/BrowseItemsChanges';
import {ManagedActionManager} from 'lib-admin-ui/managedaction/ManagedActionManager';
import {ManagedActionState} from 'lib-admin-ui/managedaction/ManagedActionState';
import {ManagedActionExecutor} from 'lib-admin-ui/managedaction/ManagedActionExecutor';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {MarkAsReadyContentAction} from './MarkAsReadyContentAction';

export enum ActionName {
    SHOW_NEW_DIALOG, PREVIEW, EDIT, DELETE, DUPLICATE, MOVE, SORT, PUBLISH, PUBLISH_TREE, UNPUBLISH, MARK_AS_READY, REQUEST_PUBLISH,
    CREATE_ISSUE, TOGGLE_SEARCH_PANEL, UNDO_PENDING_DELETE
}

export enum State {
    ENABLED, DISABLED
}

export class ContentTreeGridActions implements TreeGridActions<ContentSummaryAndCompareStatus> {

    private grid: ContentTreeGrid;

    private actionsMap: Map<ActionName, ContentTreeGridAction> = new Map<ActionName, ContentTreeGridAction>();

    private beforeActionsStashedListeners: { (): void; }[] = [];

    private actionsUnStashedListeners: { (): void; }[] = [];

    private state: State = State.ENABLED;

    constructor(grid: ContentTreeGrid) {
        this.grid = grid;
        this.initActions();
        this.initListeners();
    }

    private initActions() {
        this.actionsMap.set(ActionName.SHOW_NEW_DIALOG, new ShowNewContentDialogAction(this.grid));
        this.actionsMap.set(ActionName.PREVIEW, new PreviewContentAction(this.grid));
        this.actionsMap.set(ActionName.EDIT, new EditContentAction(this.grid));
        this.actionsMap.set(ActionName.DELETE, new DeleteContentAction(this.grid));
        this.actionsMap.set(ActionName.DUPLICATE, new DuplicateContentAction(this.grid));
        this.actionsMap.set(ActionName.MOVE, new MoveContentAction(this.grid));
        this.actionsMap.set(ActionName.SORT, new SortContentAction(this.grid));
        this.actionsMap.set(ActionName.PUBLISH, new PublishContentAction(this.grid));
        this.actionsMap.set(ActionName.PUBLISH_TREE, new PublishTreeContentAction(this.grid));
        this.actionsMap.set(ActionName.UNPUBLISH, new UnpublishContentAction(this.grid));
        this.actionsMap.set(ActionName.MARK_AS_READY, new MarkAsReadyContentAction(this.grid));
        this.actionsMap.set(ActionName.REQUEST_PUBLISH, new RequestPublishContentAction(this.grid));
        this.actionsMap.set(ActionName.CREATE_ISSUE, new CreateIssueAction(this.grid));
        this.actionsMap.set(ActionName.TOGGLE_SEARCH_PANEL, new ToggleSearchPanelAction(this.grid));
        this.actionsMap.set(ActionName.UNDO_PENDING_DELETE, new UndoPendingDeleteContentAction(this.grid));
    }

    private initListeners() {
        const previewStateChangedHandler = value => {
            this.actionsMap.get(ActionName.PREVIEW).setEnabled(value);
        };

        this.getPreviewHandler().onPreviewStateChanged(previewStateChangedHandler);

        const managedActionsHandler = (state: ManagedActionState, executor: ManagedActionExecutor) => {
            if (state === ManagedActionState.PREPARING) {
                this.notifyBeforeActionsStashed();
                this.actionsMap.forEach((action: ContentTreeGridAction) => action.stash());
            } else if (state === ManagedActionState.ENDED) {
                this.actionsMap.forEach((action: ContentTreeGridAction) => action.unStash());
                this.notifyActionsUnStashed();
            }
        };

        ManagedActionManager.instance().onManagedActionStateChanged(managedActionsHandler);

        this.grid.onRemoved(() => {
            this.getPreviewHandler().unPreviewStateChanged(previewStateChangedHandler);
            ManagedActionManager.instance().unManagedActionStateChanged(managedActionsHandler);
        });
    }

    setState(state: State) {
        this.state = state;

        if (this.state === State.DISABLED) {
            this.disableAllActions();
        } else {
            this.updateActionsEnabledState([]);
        }
    }

    private disableAllActions() {
        this.actionsMap.forEach((action: ContentTreeGridAction) => action.setEnabled(false));
    }

    onBeforeActionsStashed(listener: () => void) {
        this.beforeActionsStashedListeners.push(listener);
    }

    private notifyBeforeActionsStashed() {
        this.beforeActionsStashedListeners.forEach((listener) => {
            listener();
        });
    }

    onActionsUnStashed(listener: () => void) {
        this.actionsUnStashedListeners.push(listener);
    }

    private notifyActionsUnStashed() {
        this.actionsUnStashedListeners.forEach((listener) => {
            listener();
        });
    }

    getPreviewHandler(): PreviewContentHandler {
        return (<PreviewContentAction>this.getAction(ActionName.PREVIEW)).getPreviewHandler();
    }

    getAllCommonActions(): Action[] {
        return [
            this.getAction(ActionName.SHOW_NEW_DIALOG),
            this.getAction(ActionName.EDIT),
            this.getAction(ActionName.DELETE),
            this.getAction(ActionName.DUPLICATE),
            this.getAction(ActionName.MOVE),
            this.getAction(ActionName.SORT),
            this.getAction(ActionName.PREVIEW)
        ];
    }

    getPublishActions(): Action[] {
        return [
            this.getAction(ActionName.PUBLISH),
            this.getAction(ActionName.UNPUBLISH)
        ];
    }

    getPendingDeleteActions(): Action[] {
        return [
            this.getAction(ActionName.UNDO_PENDING_DELETE)
        ];
    }

    getAllActionsNoPublish(): Action[] {
        return [
            ...this.getAllCommonActions(),
            ...this.getPendingDeleteActions()
        ];
    }

    getAllActionsNoPendingDelete(): Action[] {
        return [
            ...this.getAllCommonActions(),
            this.getAction(ActionName.UNPUBLISH)
        ];
    }

    getAllActions(): Action[] {
        return [
            ...this.getAllActionsNoPublish(),
            ...this.getPublishActions()
        ];
    }

    // tslint:disable-next-line:max-line-length
    updateActionsEnabledState(browseItems: ContentBrowseItem[],
                              changes?: BrowseItemsChanges<ContentSummaryAndCompareStatus>): Q.Promise<void> {
        if (this.state === State.DISABLED) {
            return Q<void>(null);
        }

        if (changes && changes.getAdded().length === 0 && changes.getRemoved().length === 0) {
            return Q<void>(null);
        }

        this.getAction(ActionName.TOGGLE_SEARCH_PANEL).setVisible(false);

        let parallelPromises: Q.Promise<any>[] = [
            this.getPreviewHandler().updateState(browseItems, changes),
            this.doUpdateActionsEnabledState(browseItems)
        ];

        return Q.all(parallelPromises).catch(DefaultErrorHandler.handle);
    }

    private showDefaultActions() {
        const defaultActions = [
            this.getAction(ActionName.SHOW_NEW_DIALOG),
            this.getAction(ActionName.EDIT),
            this.getAction(ActionName.DELETE),
            this.getAction(ActionName.DUPLICATE),
            this.getAction(ActionName.MOVE),
            this.getAction(ActionName.SORT),
            this.getAction(ActionName.PREVIEW),
            this.getAction(ActionName.PUBLISH)
        ];
        defaultActions.forEach(action => action.setVisible(true));
    }

    private doUpdateActionsEnabledState(contentBrowseItems: ContentBrowseItem[]): Q.Promise<any> {
        const items: ContentSummaryAndCompareStatus[] = contentBrowseItems.map((item: ContentBrowseItem) => item.getModel());

        return this.getAllowedPermissions(items).then((permissions: Permission[]) => {
            const state: ContentTreeGridItemsState = new ContentTreeGridItemsState(items, permissions);
            this.toggleActions(state);

            if (items.length === 0) {
                this.toggleVisibilityNoItemsSelected();
                return Q(null);
            }

            this.toggleVisibility(state);
            return this.updateDefaultActionsMultipleItemsSelected(items);
        });
    }

    private getAllowedPermissions(items: ContentSummaryAndCompareStatus[]): Q.Promise<Permission[]> {
        const request: GetPermittedActionsRequest = new GetPermittedActionsRequest();

        if (items.length === 0) {
            request.addPermissionsToBeChecked(Permission.CREATE);
        } else {
            const contentIds: ContentId[] = items.map((item: ContentSummaryAndCompareStatus) => item.getContentId());
            request.addContentIds(...contentIds);
            request.addPermissionsToBeChecked(Permission.CREATE, Permission.DELETE, Permission.PUBLISH, Permission.MODIFY);
        }

        return request.sendAndParse();
    }

    private toggleActions(state: ContentTreeGridItemsState) {
        this.actionsMap.forEach((action: ContentTreeGridAction) => action.setEnabledByState(state));
    }

    private toggleVisibility(state: ContentTreeGridItemsState) {
        if (state.hasAnyPendingDelete()) {
            const invisibleActions: Action[] = state.hasAllPendingDelete()
                                               ? this.getAllActionsNoPendingDelete()
                                               : this.getAllActions();
            invisibleActions.forEach(action => action.setVisible(false));
        } else {
            this.getAllCommonActions().forEach(action => action.setVisible(true));
            this.getAction(ActionName.UNPUBLISH).setVisible(this.getAction(ActionName.UNPUBLISH).isEnabled());
        }

        this.getAction(ActionName.PUBLISH).setVisible(
            state.hasAllPendingDelete() || this.getAction(ActionName.PUBLISH).isEnabled());
        this.getPendingDeleteActions().forEach((action) => action.setVisible(state.hasAllPendingDelete()));
        (<EditContentAction>this.getAction(ActionName.EDIT)).updateLabel(state);
    }

    private toggleVisibilityNoItemsSelected() {
        this.getAction(ActionName.UNPUBLISH).setVisible(false);
        this.getAction(ActionName.UNDO_PENDING_DELETE).setVisible(false);
        (<EditContentAction>this.getAction(ActionName.EDIT)).resetLabel();
        this.showDefaultActions();
    }

    private handleContentTypeNotFound(selectedItem: ContentSummaryAndCompareStatus) {
        NotifyManager.get().showWarning(
            i18n('notify.contentType.notFound', selectedItem.getContentSummary().getType().getLocalName()));

        this.disableAllActions();
        this.getAction(ActionName.CREATE_ISSUE).setEnabled(true);

        this.getAction(ActionName.UNPUBLISH).setVisible(false);
        this.getAction(ActionName.UNDO_PENDING_DELETE).setVisible(false);
        (<EditContentAction>this.getAction(ActionName.EDIT)).resetLabel();
        this.showDefaultActions();
    }

    private updateDefaultActionsMultipleItemsSelected(items: ContentSummaryAndCompareStatus[]): Q.Promise<void> {
        const promises: Q.Promise<void>[] = [];

        if (items.length === 1 &&
            (this.getAction(ActionName.SHOW_NEW_DIALOG).isEnabled() || this.getAction(ActionName.SORT).isEnabled())) {
            promises.push(this.checkIsChildrenAllowedByContentType(items[0]).then((childrenAllowed: boolean) => {
                if (!childrenAllowed) {
                    this.getAction(ActionName.SHOW_NEW_DIALOG).setEnabled(false);
                    this.getAction(ActionName.SORT).setEnabled(false);
                }

                return Q(null);
            }));
        }

        if (this.getAction(ActionName.PUBLISH_TREE).isEnabled()) {
            promises.push(this.updatePublishTreeAction(items));
        }

        return Q.all(promises).thenResolve(null);
    }

    private updatePublishTreeAction(items: ContentSummaryAndCompareStatus[]): Q.Promise<void> {
        return new HasUnpublishedChildrenRequest(items.map((item: ContentSummaryAndCompareStatus) => item.getContentId()))
            .sendAndParse().then((hasUnpublishedChildrenResult: HasUnpublishedChildrenResult) => {
                const hasUnpublishedChildren: boolean =
                    hasUnpublishedChildrenResult.getResult().some((item: HasUnpublishedChildren) => item.getHasChildren());

                this.getAction(ActionName.PUBLISH_TREE).setEnabled(hasUnpublishedChildren);
            }).catch(reason => DefaultErrorHandler.handle(reason));
    }

    private checkIsChildrenAllowedByContentType(selectedItem: ContentSummaryAndCompareStatus): Q.Promise<Boolean> {
        const deferred = Q.defer<boolean>();

        new GetContentTypeByNameRequest(selectedItem.getContentSummary().getType()).sendAndParse()
            .then((contentType: ContentType) => deferred.resolve(contentType && contentType.isAllowChildContent()))
            .fail(() => this.handleContentTypeNotFound(selectedItem));

        return deferred.promise;
    }

    getAction(name: ActionName): Action {
        return this.actionsMap.get(name);
    }
}
