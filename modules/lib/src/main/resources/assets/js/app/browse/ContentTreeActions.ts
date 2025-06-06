import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';


import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {TreeGridActions} from '@enonic/lib-admin-ui/ui/treegrid/actions/TreeGridActions';
import {ManagedActionManager} from '@enonic/lib-admin-ui/managedaction/ManagedActionManager';
import {ManagedActionState} from '@enonic/lib-admin-ui/managedaction/ManagedActionState';
import {ManagedActionExecutor} from '@enonic/lib-admin-ui/managedaction/ManagedActionExecutor';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentTreeGridAction} from './action/ContentTreeGridAction';
import {ShowNewContentDialogAction} from './action/ShowNewContentDialogAction';
import {EditContentAction} from './action/EditContentAction';
import {DuplicateContentAction} from './action/DuplicateContentAction';
import {ArchiveContentAction} from './action/ArchiveContentAction';
import {MoveContentAction} from './action/MoveContentAction';
import {SortContentAction} from './action/SortContentAction';
import {PublishContentAction} from './action/PublishContentAction';
import {PublishTreeContentAction} from './action/PublishTreeContentAction';
import {UnpublishContentAction} from './action/UnpublishContentAction';
import {MarkAsReadyContentAction} from './action/MarkAsReadyContentAction';
import {RequestPublishContentAction} from './action/RequestPublishContentAction';
import {CreateIssueAction} from './action/CreateIssueAction';
import {ToggleSearchPanelAction} from './action/ToggleSearchPanelAction';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {Permission} from '../access/Permission';
import {ContentTreeGridItemsState} from './action/ContentTreeGridItemsState';
import {GetPermittedActionsRequest} from '../resource/GetPermittedActionsRequest';
import {ContentId} from '../content/ContentId';
import {HasUnpublishedChildrenRequest} from '../resource/HasUnpublishedChildrenRequest';
import {HasUnpublishedChildren, HasUnpublishedChildrenResult} from '../resource/HasUnpublishedChildrenResult';
import {GetContentTypeByNameRequest} from '../resource/GetContentTypeByNameRequest';
import {ContentType} from '../inputtype/schema/ContentType';
import {State} from './State';


export enum ActionName {
    SHOW_NEW_DIALOG, EDIT, ARCHIVE, DUPLICATE, MOVE, SORT, PUBLISH, PUBLISH_TREE, UNPUBLISH, MARK_AS_READY, REQUEST_PUBLISH,
    CREATE_ISSUE, TOGGLE_SEARCH_PANEL
}

export class ContentTreeActions implements TreeGridActions<ContentSummaryAndCompareStatus> {

    private readonly grid: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>;

    private actionsMap: Map<ActionName, ContentTreeGridAction> = new Map<ActionName, ContentTreeGridAction>();

    private beforeActionsStashedListeners: (() => void)[] = [];

    private actionsUnStashedListeners: (() => void)[] = [];

    private state: State = State.ENABLED;

    constructor(grid: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>) {
        this.grid = grid;
        this.initActions();
        this.initListeners();
    }

    private initActions() {
        this.actionsMap.set(ActionName.SHOW_NEW_DIALOG, new ShowNewContentDialogAction(this.grid));
        this.actionsMap.set(ActionName.EDIT, new EditContentAction(this.grid));
        this.actionsMap.set(ActionName.ARCHIVE, new ArchiveContentAction(this.grid));
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
    }

    private initListeners() {

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

    getAllCommonActions(): Action[] {
        return [
            this.getAction(ActionName.SHOW_NEW_DIALOG),
            this.getAction(ActionName.EDIT),
            this.getAction(ActionName.ARCHIVE),
            this.getAction(ActionName.DUPLICATE),
            this.getAction(ActionName.MOVE),
            this.getAction(ActionName.SORT)
        ];
    }

    getPublishActions(): Action[] {
        return [
            this.getAction(ActionName.PUBLISH),
            this.getAction(ActionName.UNPUBLISH)
        ];
    }

    getPublishAction(): Action {
        return this.getAction(ActionName.PUBLISH);
    }

    getToggleSearchPanelAction(): Action {
        return this.getAction(ActionName.TOGGLE_SEARCH_PANEL);
    }

    getAllActionsNoPublish(): Action[] {
        return [
            ...this.getAllCommonActions()
        ];
    }

    getEditAction(): Action {
        return this.getAction(ActionName.EDIT);
    }

    getAllActions(): Action[] {
        return [
            ...this.getAllActionsNoPublish(),
            ...this.getPublishActions()
        ];
    }

    updateActionsEnabledState(items: ContentSummaryAndCompareStatus[]): Q.Promise<void> {
        if (this.state === State.DISABLED) {
            return Q<void>(null);
        }

        this.getAction(ActionName.TOGGLE_SEARCH_PANEL).setVisible(false);

        const parallelPromises: Q.Promise<void>[] = [
            this.doUpdateActionsEnabledState(items)
        ];

        return Q.all(parallelPromises).catch(DefaultErrorHandler.handle);
    }

    private showDefaultActions() {
        const defaultActions = [
            this.getAction(ActionName.SHOW_NEW_DIALOG),
            this.getAction(ActionName.EDIT),
            this.getAction(ActionName.ARCHIVE),
            this.getAction(ActionName.DUPLICATE),
            this.getAction(ActionName.MOVE),
            this.getAction(ActionName.SORT),
            this.getAction(ActionName.PUBLISH)
        ];
        defaultActions.forEach(action => action.setVisible(true));
    }

    private doUpdateActionsEnabledState(items: ContentSummaryAndCompareStatus[]): Q.Promise<void> {
        return this.getAllowedPermissions(items).then((permissions: Permission[]) => {
            const state: ContentTreeGridItemsState = new ContentTreeGridItemsState(items, permissions);
            this.toggleActions(state);

            if (items.length === 0) {
                this.toggleVisibilityNoItemsSelected();
                return;
            }

            this.toggleVisibility(state);
            return this.updateDefaultActionsMultipleItemsSelected(items);
        });
    }

    private getAllowedPermissions(items: ContentSummaryAndCompareStatus[]): Q.Promise<Permission[]> {
        if (items.some((item: ContentSummaryAndCompareStatus) => item.hasUploadItem())) {
            return Q([]);
        }

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
        this.getAllCommonActions().forEach(action => action.setVisible(true));
        this.getAction(ActionName.UNPUBLISH).setVisible(this.getAction(ActionName.UNPUBLISH).isEnabled());
        this.getAction(ActionName.PUBLISH).setVisible(this.getAction(ActionName.PUBLISH).isEnabled());
        (this.getAction(ActionName.EDIT) as EditContentAction).updateLabel(state);
    }

    private toggleVisibilityNoItemsSelected() {
        this.getAction(ActionName.UNPUBLISH).setVisible(false);
        (this.getAction(ActionName.EDIT) as EditContentAction).resetLabel();
        this.showDefaultActions();
    }

    private handleContentTypeNotFound(selectedItem: ContentSummaryAndCompareStatus) {
        NotifyManager.get().showWarning(
            i18n('notify.contentType.notFound', selectedItem.getContentSummary().getType().getLocalName()));

        this.disableAllActions();
        this.getAction(ActionName.CREATE_ISSUE).setEnabled(true);

        this.getAction(ActionName.UNPUBLISH).setVisible(false);
        (this.getAction(ActionName.EDIT) as EditContentAction).resetLabel();
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

    private checkIsChildrenAllowedByContentType(selectedItem: ContentSummaryAndCompareStatus): Q.Promise<boolean> {
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
