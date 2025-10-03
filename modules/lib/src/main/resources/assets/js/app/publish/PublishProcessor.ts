import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import Q from 'q';
import {CompareStatus} from '../content/CompareStatus';
import {ContentId} from '../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {SelectionType} from '../dialog/DialogDependantItemsList';
import {EditContentEvent} from '../event/EditContentEvent';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {FindIdsByParentsRequest} from '../resource/FindIdsByParentsRequest';
import {GetDescendantsOfContentsRequest} from '../resource/GetDescendantsOfContentsRequest';
import {ResolvePublishDependenciesRequest} from '../resource/ResolvePublishDependenciesRequest';
import {ResolvePublishDependenciesResult} from '../resource/ResolvePublishDependenciesResult';
import {PublishDialogDependantList} from './PublishDialogDependantList';
import {PublishDialogItemList} from './PublishDialogItemList';

interface ReloadDependenciesParams {
    resetDependantItems?: boolean;
    resetExclusions?: boolean;
    silent?: boolean;
}

interface LoadDependenciesParams
    extends ReloadDependenciesParams {
    ids: ContentId[];
}

export type LoadingStartedListener = (checking: boolean) => void;

export class PublishProcessor {

    private itemList: PublishDialogItemList;

    private dependantList: PublishDialogDependantList;

    private excludedIds: ContentId[] = [];

    private dependantIds: ContentId[] = [];

    private allDependantIds: ContentId[] = [];

    private invalidIds: ContentId[] = [];

    private inProgressIds: ContentId[] = [];

    private notPublishableIds: ContentId[] = [];

    private requiredIds: ContentId[] = [];

    private nextIds: ContentId[] = [];

    private childrenIds: ContentId[] = [];

    private somePublishable: boolean;

    private loadExcluded: boolean = false;

    private ignoreItemsChanged: boolean;

    private ignoreDependantItemsChanged: boolean;

    private checkPublishable: boolean = true;

    private ignoreSilent?: boolean = false;

    private loadingStartedListeners: LoadingStartedListener[] = [];

    private loadingFinishedListeners: (() => void)[] = [];

    private loadingFailedListeners: (() => void)[] = [];

    private instanceId: number;

    private cleanLoad: boolean = true;

    private keepDependencies: boolean;

    private notificationMsgId: string;

    readonly reloadDependenciesDebounced: (params: ReloadDependenciesParams) => void;

    private static debug: boolean = false;

    constructor(itemList: PublishDialogItemList, dependantList: PublishDialogDependantList, keepDependencies = false) {
        this.instanceId = 0;
        this.itemList = itemList;
        this.dependantList = dependantList;
        this.keepDependencies = keepDependencies;
        this.reloadDependenciesDebounced = AppHelper.debounce(this.reloadPublishDependencies.bind(this), 100);

        this.initListeners();
    }

    private initListeners(): void {
        this.itemList.onItemsRemoved(() => {
            if (!this.ignoreItemsChanged) {
                this.reloadDependenciesDebounced({
                    resetDependantItems: true,
                    resetExclusions: true,
                    silent: !this.ignoreSilent && !this.itemList.isVisible(),
                });
            }
        });

        this.itemList.onItemsAdded((items) => {
            const newIds: string[] = items.map(item => item.getId());
            this.setExcludedIds(this.excludedIds.filter(id => newIds.indexOf(id.toString()) < 0));
            if (!this.ignoreItemsChanged) {
                this.reloadDependenciesDebounced({
                    resetDependantItems: true,
                    silent: !this.ignoreSilent && !this.itemList.isVisible(),
                });
            }
        });

        this.itemList.onChildrenListChanged((childrenRemoved) => {
            this.reloadDependenciesDebounced({
                resetDependantItems: true,
                resetExclusions: !this.keepDependencies || childrenRemoved,
                silent: !this.ignoreSilent && !this.itemList.isVisible(),
            });
        });

        const itemClickedFn = (item: ContentSummaryAndCompareStatus) => new EditContentEvent([item]).fire();

        this.itemList.onItemClicked(itemClickedFn);
        this.dependantList.onItemClicked(itemClickedFn);

        this.dependantList.onExclusionUpdated((event) => {
            if (!event.manual) {
                const selectionType = this.dependantList.getSelectionType();
                switch (selectionType) {
                    case SelectionType.NONE: {
                        if (this.loadExcluded) {
                            this.setExcludedIds(this.allDependantIds);
                        } else {
                            this.addExcludedIds(this.allDependantIds);
                        }
                    break;
                    }
                case SelectionType.ALL:
                    this.setExcludedIds([]);
                    break;
                case SelectionType.PARTIAL: {
                    const partlyExcludedIds = this.allDependantIds.filter(id => {
                        return this.dependantList.getExcludedIds().some(excludedId => excludedId.equals(id));
                    });
                    if (this.loadExcluded) {
                        this.setExcludedIds(partlyExcludedIds);
                    } else {
                        this.addExcludedIds(partlyExcludedIds);
                    }
                    break;
                }
                }

                this.reloadDependenciesDebounced({
                    resetDependantItems: true,
                    silent: !this.ignoreSilent && !this.dependantList.isVisible(),
                });
            }
        });

        this.dependantList.onListChanged(() => {
            if (!this.ignoreDependantItemsChanged) {
                this.reloadDependenciesDebounced({
                    resetDependantItems: true,
                    silent: !this.ignoreSilent && !this.dependantList.isVisible(),
                });
            }
        });

        this.itemList.onItemsChanged(() => {
            this.reloadDependenciesDebounced({resetDependantItems: false});
        });
    }

    setKeepDependencies(keepDependencies: boolean): void {
        this.keepDependencies = keepDependencies;
    }

    reloadPublishDependencies(params: ReloadDependenciesParams): void {
        if (this.notificationMsgId && !params.silent) { // Hide previous notification about missing outbound ids
            NotifyManager.get().hide(this.notificationMsgId);
            this.notificationMsgId = null;
        }

        const {resetDependantItems, resetExclusions, silent} = params;
        const excludeNonRequired = CONFIG.isTrue('excludeDependencies') && !this.keepDependencies;

        if (!silent) {
            this.notifyLoadingStarted(true);
        }

        const ids = this.getContentToPublishIds();
        const isNoItemsToPublish = ids.length === 0;
        const needExcludeNonRequired = excludeNonRequired && (this.cleanLoad || resetExclusions) && !isNoItemsToPublish;
        const isNothingToExclude = !resetExclusions && this.isSomeOrNoneExcluded();

        if (resetExclusions) {
            this.resetExcludedIds();
        }

        if (isNoItemsToPublish) {
            this.handleNoPublishItemsToLoad(resetDependantItems, silent);
        } else if (needExcludeNonRequired && !isNothingToExclude) {
            void this.cleanLoadPublishDependencies({...params, ids});
        } else {
            void this.loadPublishDependencies({...params, ids});
        }
    }

    private handleNoPublishItemsToLoad(resetDependantItems?: boolean, silent?: boolean): void {
        this.dependantIds = [];
        this.allDependantIds = [];
        this.dependantList.setRequiredIds([]);
        this.dependantList.updateVisibleIds([]);
        this.inProgressIds = [];
        this.invalidIds = [];
        this.requiredIds = [];
        this.nextIds = [];
        this.childrenIds = [];
        this.notPublishableIds = [];
        this.somePublishable = true;

        this.processResolveDescendantsResult([], resetDependantItems);

        if (!silent) {
            this.notifyLoadingFinished();
        }
    }

    private processResolveDescendantsResult(dependants: ContentSummaryAndCompareStatus[], resetDependantItems?: boolean): void {
        if (PublishProcessor.debug) {
            console.debug('PublishProcessor.reloadPublishDependencies: resolved dependants = ', dependants);
        }

        // just opened or first time loading children
        if (resetDependantItems) {
            this.dependantList.setItems(dependants);
        } else {
            this.filterDependantItems(dependants);
        }

        this.dependantList.refresh();
    }

    private async cleanLoadPublishDependencies({ids, resetDependantItems, silent}: LoadDependenciesParams): Promise<void> {
        const instanceId = this.instanceId;
        this.cleanLoad = false;

        try {
            const [maxResult, childrenIds] = await Q.all([
                this.createResolveDependenciesRequest(ids).sendAndParse(),
                this.findIncludedChildrenIds(),
            ]);

            this.childrenIds = childrenIds;

            const potentialExcludedIds = maxResult.getDependants().filter(id => !this.itemsIncludeId(childrenIds, id));

            const minResult = await this.createResolveDependenciesRequest(ids, potentialExcludedIds).sendAndParse();

            if (instanceId !== this.instanceId) {
                return;
            }

            const excludedIds = maxResult.getDependants().filter(id => {
                return !this.itemsIncludeId(this.childrenIds, id) &&
                       !this.itemsIncludeId(minResult.getDependants(), id) &&
                       !this.itemsIncludeId(this.itemList.getItemsIds(), id);
            });

            this.notifyIfOutboundContentsNotFound(maxResult);
            this.processResolveDependenciesResult(minResult);
            this.setExcludedIds(excludedIds);
            this.handleExclusionResult();
            this.handleMissingExcludedIds(minResult.getDependants());

            this.allDependantIds = maxResult.getDependants();

            const descendants = await this.loadDescendants();
            this.handlePublishedDescendants(descendants);

            if (instanceId !== this.instanceId) {
                return;
            }

            this.processResolveDescendantsResult(descendants, resetDependantItems);
            if (!silent) {
                this.notifyLoadingFinished();
            }
        } catch (reason) {
            if (instanceId === this.instanceId) {
                this.notifyLoadingFailed();
                DefaultErrorHandler.handle(reason);
            }
        }
    }

    private async loadPublishDependencies({ids, resetDependantItems, resetExclusions, silent}: LoadDependenciesParams): Promise<void> {
        const instanceId = this.instanceId;
        this.cleanLoad = false;

        try {
            const [result, childrenIds] = await Q.all([
                this.createResolveDependenciesRequest(ids, this.getExcludedIds()).sendAndParse(),
                resetDependantItems ? this.findIncludedChildrenIds() : Q.resolve(this.childrenIds),
            ]);

            this.childrenIds = childrenIds;

            if (instanceId !== this.instanceId) {
                return;
            }

            const originalAllDependantIds = this.getDependantIds(true);
            const excludedIds = originalAllDependantIds.length > 0 ? originalAllDependantIds.filter(id => {
                return !this.itemsIncludeId(this.itemList.getItemsIds(), id) &&
                       !this.itemsIncludeId(result.getDependants(), id);
            }) : result.getNextDependants();

            this.processResolveDependenciesResult(result);

            if (resetExclusions) {
                this.setExcludedIds(excludedIds);
            } else {
                this.addExcludedIds(excludedIds);
            }

            this.notifyIfOutboundContentsNotFound(result);
            this.handleExclusionResult();
            this.handleExcessiveExcludedIds(resetExclusions ? [] : undefined);

            const hasExcluded = this.getExcludedIds().length > 0;
            const allDependantIds = hasExcluded ? await this.createResolveDependenciesRequest(ids).sendAndParse().then(
                r => r.getDependants()) : this.dependantIds;

            if (instanceId !== this.instanceId) {
                return;
            }

            this.allDependantIds = [...allDependantIds];

            const descendants = await this.loadDescendants();
            this.handlePublishedDescendants(descendants);

            if (instanceId !== this.instanceId) {
                return;
            }

            this.processResolveDescendantsResult(descendants, resetDependantItems);
            if (!silent) {
                this.notifyLoadingFinished();
            }
        } catch (reason) {
            if (instanceId === this.instanceId) {
                this.notifyLoadingFailed();
                DefaultErrorHandler.handle(reason);
            }
        }
    }

    private notifyIfOutboundContentsNotFound(resolveResult: ResolvePublishDependenciesResult): void {
        if (resolveResult.getNotFoundOutboundContents().length > 0) {
            const ids = resolveResult.getNotFoundOutboundContents().map(id => id.toString()).join(', ');
            this.notificationMsgId = NotifyManager.get().showWarning(i18n('dialog.publish.outbound.missing', ids), false);
        }
    }

    updateLoadExcluded(loadExcluded: boolean): void {
        const isLoadExcludedChanged = this.loadExcluded !== loadExcluded;
        if (!isLoadExcludedChanged) {
            return;
        }

        this.loadExcluded = loadExcluded;

        const ids = this.getContentToPublishIds();
        const isNoItemsToPublish = ids.length === 0;
        if (isNoItemsToPublish) {
            return;
        }

        if (!loadExcluded) {
            this.allDependantIds = this.dependantIds.slice();
            const dependants = this.dependantList.getItems().filter(item => this.allDependantIds.some(id => id.equals(item.getContentId())));
            this.processResolveDescendantsResult(dependants, true);
            return;
        }

        const instanceId = this.instanceId;
        this.notifyLoadingStarted(false);

        this.createResolveDependenciesRequest(ids).sendAndParse().then((result: ResolvePublishDependenciesResult) => {
            if (this.instanceId === instanceId) {
                this.allDependantIds = [...result.getDependants()];

                return this.loadDescendants().then((descendants: ContentSummaryAndCompareStatus[]) => {
                    if (instanceId === this.instanceId) {
                        this.processResolveDescendantsResult(descendants, true);
                        this.notifyLoadingFinished();
                    }
                });
            }
        }).catch((reason) => {
            if (instanceId === this.instanceId) {
                this.notifyLoadingFailed();
                DefaultErrorHandler.handle(reason);
            }
        });
    }

    calcVisibleIds(): ContentId[] {
        const allVisibleIds = [
            ...this.dependantIds,
            ...this.nextIds,
            ...this.getDependantChildrenIds(),
        ].map(id => id.toString());

        // Filter in the whole content to keep sorting order
        return this.allDependantIds.filter(id => allVisibleIds.indexOf(id.toString()) >= 0);
    }

    private getDependantChildrenIds(): ContentId[] {
        return this.allDependantIds.filter(id => this.itemsIncludeId(this.childrenIds, id));
    }

    private findIncludedChildrenIds(): Q.Promise<ContentId[]> {
        const parentIds = this.itemList.getIncludeChildrenIds();
        return parentIds.length === 0 ? Q([]) : new FindIdsByParentsRequest(parentIds).sendAndParse();
    }

    private createResolveDependenciesRequest(
        ids: ContentId[],
        excludedIds: ContentId[] = [],
        excludedChildrenIds?: ContentId[],
    ): ResolvePublishDependenciesRequest {

        return ResolvePublishDependenciesRequest.create()
            .setIds(ids)
            .setExcludedIds(excludedIds)
            .setExcludeChildrenIds(excludedChildrenIds ?? this.getExcludeChildrenIds())
            .build();
    }

    private processResolveDependenciesResult(result: ResolvePublishDependenciesResult): void {
        this.dependantIds = result.getDependants().slice();
        this.invalidIds = result.getInvalid();
        this.inProgressIds = result.getInProgress();
        this.requiredIds = result.getRequired();
        this.nextIds = result.getNextDependants();
        this.notPublishableIds = result.getNotPublishable();
        this.somePublishable = result.isSomePublishable();

        this.dependantList.setRequiredIds(result.getRequired());
        this.dependantList.updateVisibleIds(this.calcVisibleIds());
    }

    private loadDescendants(): Q.Promise<ContentSummaryAndCompareStatus[]> {
        const dependantsIds = this.getVisibleDependantIds(this.loadExcluded);
        const noDependantItems = dependantsIds.length === 0;

        if (noDependantItems) {
            return Q([]);
        }

        const slicedIds = dependantsIds.slice(0, GetDescendantsOfContentsRequest.LOAD_SIZE);
        return new ContentSummaryAndCompareStatusFetcher().fetchAndCompareStatus(slicedIds);
    }

    private handleExclusionResult(): void {
        const inProgressIds = this.getInProgressIdsWithoutInvalid();
        const invalidIds = this.getInvalidIds();
        if (this.isAnyExcluded(inProgressIds) || this.isAnyExcluded(invalidIds)) {
            NotifyManager.get().showFeedback(i18n('dialog.publish.notAllExcluded'));
        }
    }

    private handleMissingExcludedIds(dependantsIds?: ContentId[]): void {
        const itemsIds = this.itemList.getItemsIds();
        const missingExcludedIds = (dependantsIds ?? this.dependantList.getItemsIds())
            .filter(id =>
                !this.itemsIncludeId(this.dependantIds, id) &&
                !this.itemsIncludeId(this.excludedIds, id) &&
                !this.itemsIncludeId(itemsIds, id));

        if (missingExcludedIds.length > 0) {
            this.setExcludedIds([...this.excludedIds, ...missingExcludedIds]);
        }
    }

    private handleExcessiveExcludedIds(requiredIds?: ContentId[]): void {
        const excludedIds = this.excludedIds.filter(id => {
            return !this.itemsIncludeId(requiredIds ?? this.requiredIds, id);
        });

        const isExcludedIdsChanged = excludedIds.length !== this.excludedIds.length;
        if (isExcludedIdsChanged) {
            this.setExcludedIds(excludedIds);
        }
    }

    private handlePublishedDescendants(descendants: ContentSummaryAndCompareStatus[]): void {
        const publishedIds = descendants.filter(item => item.isPublished() && item.isOnline()).map(item => item.getContentId());
        this.childrenIds = this.childrenIds.filter(id => !this.itemsIncludeId(publishedIds, id));
        this.dependantList.updateVisibleIds(this.calcVisibleIds());
    }

    private itemsIncludeId(sourceIds: ContentId[], targetId: ContentId): boolean {
        return sourceIds.some((sourceId: ContentId) => sourceId.equals(targetId));
    }

    private isAnyExcluded(ids: ContentId[]): boolean {
        if (this.getExcludedIds().length === 0) {
            return false;
        }

        return this.getExcludedIds().some((excludedId: ContentId) => this.itemsIncludeId(ids, excludedId));
    }

    private isSomeOrNoneExcluded(): boolean {
        return !this.allDependantIds.every((dependantId: ContentId) => this.itemsIncludeId(this.getExcludedIds(), dependantId));
    }

    getInProgressCount(dependantOnly = false): number {
        const ids = this.getInProgressIdsWithoutInvalid();
        return dependantOnly ? ids.filter(id => this.itemsIncludeId(this.dependantIds, id)).length : ids.length;
    }

    getInvalidCount(dependantOnly = false): number {
        const ids = this.getInvalidIds();
        return dependantOnly ? ids.filter(id => this.itemsIncludeId(this.dependantIds, id)).length : ids.length;
    }

    getNotPublishableCount(dependantOnly = false): number {
        const ids = this.getNotPublishableIds();
        return dependantOnly ? ids.filter(id => this.itemsIncludeId(this.dependantIds, id)).length : ids.length;
    }

    private getExcludableFromIdsCount(ids: ContentId[]): number {
        return ids.filter(id => {
            return !this.itemsIncludeId(this.excludedIds, id) &&
                   !this.itemsIncludeId(this.requiredIds, id) &&
                   this.itemsIncludeId(this.dependantIds, id);
        }).length;
    }

    canExcludeInProgress(): boolean {
        const inProgressTotal = this.getInProgressCount(true);
        return this.getExcludableFromIdsCount(this.getInProgressIdsWithoutInvalid()) === inProgressTotal && inProgressTotal > 0;
    }

    canExcludeInvalid(): boolean {
        const invalidTotal = this.getInvalidCount(true);
        return this.getExcludableFromIdsCount(this.getInvalidIds()) === invalidTotal && invalidTotal > 0;
    }

    canExcludeNotPublishable(): boolean {
        const notPublishableTotal = this.getNotPublishableCount(true);
        return this.getExcludableFromIdsCount(this.getNotPublishableIds()) === notPublishableTotal && notPublishableTotal > 0;
    }

    reset(): void {
        this.instanceId += 1;
        this.cleanLoad = true;

        this.itemList.setExcludeChildrenIds([]);
        this.itemList.setItems([]);
        this.itemList.setReadOnly(false);

        this.dependantList.setRequiredIds([]);
        this.dependantList.updateVisibleIds([]);
        this.dependantList.setItems([]);
        this.dependantList.setReadOnly(false);

        this.resetExcludedIds();
    }

    getContentToPublishIds(): ContentId[] {
        return this.itemList.getItemsIds();
    }

    containsOnlyScheduledItems(): boolean {
        return this.itemList.getItems()
            .concat(this.dependantList.getItems())
            .every((item: ContentSummaryAndCompareStatus) => item.isScheduledPublishing());
    }

    containsNotPublished(): boolean {
        return this.itemList.getItems()
            .concat(this.dependantList.getItems())
            .some((item: ContentSummaryAndCompareStatus) => item.isNew());
    }

    countParent(): number {
        return this.countToPublish(this.itemList.getItems());
    }

    countTotal(): number {
        return this.countParent() + this.dependantIds.length;
    }

    isAllPublishable(): boolean {
        return this.notPublishableIds.length === 0;
    }

    getNotPublishableIds(): ContentId[] {
        return this.notPublishableIds;
    }

    isSomePublishable(): boolean {
        return this.somePublishable;
    }

    hasSchedulable(): boolean {
        return this.somePublishable && this.containsNotPublished();
    }

    containsInvalidItems(): boolean {
        return this.invalidIds.length > 0;
    }

    getInvalidIds(): ContentId[] {
        return this.invalidIds;
    }

    getInvalidIdsWithoutRequired(): ContentId[] {
        return this.invalidIds.filter((id: ContentId) => !this.itemsIncludeId(this.requiredIds, id));
    }

    setCheckPublishable(flag: boolean): void {
        this.checkPublishable = flag;
    }

    isCheckPublishable(): boolean {
        return this.checkPublishable;
    }

    setIgnoreSilent(ignore: boolean): void {
        this.ignoreSilent = ignore;
    }

    areAllConditionsSatisfied(itemsToPublish: number): boolean {
        const allValid: boolean = !this.containsInvalidItems();
        const allPublishable: boolean = this.isAllPublishable();
        const containsItemsInProgress: boolean = this.containsItemsInProgress();
        return itemsToPublish > 0 && allValid && !containsItemsInProgress && (!this.checkPublishable || allPublishable);
    }

    containsInvalidDependants(): boolean {
        return this.dependantList.getItems().some(item => !item.getContentSummary().isValid());
    }

    containsItemsInProgress(): boolean {
        return this.inProgressIds.length > 0;
    }

    getInProgressIds(): ContentId[] {
        return this.inProgressIds;
    }

    getInProgressIdsWithoutInvalid(): ContentId[] {
        return this.inProgressIds.filter((id: ContentId) => !this.itemsIncludeId(this.invalidIds, id));
    }

    getInProgressIdsWithoutInvalidAndRequired(): ContentId[] {
        return this.getInProgressIdsWithoutInvalid().filter((id: ContentId) => !this.itemsIncludeId(this.requiredIds, id));
    }

    getDependantIds(all?: boolean): ContentId[] {
        return all ? this.allDependantIds : this.dependantIds;
    }

    getVisibleDependantIds(all?: boolean): ContentId[] {
        return all ? this.calcVisibleIds() : this.dependantIds;
    }

    resetDependantIds(): void {
        this.dependantIds = [];
        this.allDependantIds = [];
        this.nextIds = [];
        this.childrenIds = [];
    }

    getNextIds(): ContentId[] {
        return this.nextIds;
    }

    getExcludedIds(): ContentId[] {
        return this.excludedIds;
    }

    addExcludedIds(ids: ContentId[]) {
        this.excludedIds = this.dependantList.addExcludedIds(ids ?? []);
    }

    setExcludedIds(ids: ContentId[]) {
        this.excludedIds = this.dependantList.setExcludedIds(ids ?? []);
    }

    resetExcludedIds() {
        this.setExcludedIds([]);
    }

    getExcludeChildrenIds(): ContentId[] {
        return this.itemList.getExcludeChildrenIds();
    }

    setIgnoreItemsChanged(value: boolean) {
        this.ignoreItemsChanged = value;
    }

    setIgnoreDependantItemsChanged(value: boolean) {
        this.ignoreDependantItemsChanged = value;
    }

    setLoadExcluded(loadExcluded: boolean): void {
        this.loadExcluded = loadExcluded;
    }

    private countToPublish(summaries: ContentSummaryAndCompareStatus[]): number {
        return summaries.reduce((count, summary: ContentSummaryAndCompareStatus) => {
            return summary.getCompareStatus() !== CompareStatus.EQUAL ? ++count : count;
        }, 0);
    }

    private filterDependantItems(dependants: ContentSummaryAndCompareStatus[]) {
        let itemsToRemove = this.dependantList.getItems().filter(
            (oldDependantItem: ContentSummaryAndCompareStatus) => !dependants.some(
                (newDependantItem) => oldDependantItem.equals(newDependantItem)));
        this.dependantList.removeItems(itemsToRemove);
    }

    private excludeItems(ids: ContentId[]): void {
        if (ids.length === 0) {
            return;
        }

        const excludedIds = this.excludedIds.map(id => id.toString());
        const newExcludedIds = ids.filter(id => {
            const isAlreadyExcluded = excludedIds.indexOf(id.toString()) >= 0;
            if (!isAlreadyExcluded) {
                excludedIds.push(id.toString());
                return true;
            }
            return false;
        });

        this.setExcludedIds([...this.excludedIds, ...newExcludedIds]);

        this.itemList.removeItemsByIds(ids);
        this.reloadDependenciesDebounced({resetDependantItems: true});
    }

    excludeInProgress(): void {
        const inProgressDependantIds = this.getInProgressIdsWithoutInvalid().filter(id => this.itemsIncludeId(this.dependantIds, id));
        this.excludeItems(inProgressDependantIds);
    }

    excludeInvalid(): void {
        const invalidDependantIds = this.getInvalidIds().filter(id => this.itemsIncludeId(this.dependantIds, id));
        this.excludeItems(invalidDependantIds);
    }

    excludeNotPublishable(): void {
        const notPublishableDependantIds = this.getNotPublishableIds().filter(id => this.itemsIncludeId(this.dependantIds, id));
        this.excludeItems(notPublishableDependantIds);
    }

    getItemsTotalInProgress(): number {
        return this.inProgressIds.length;
    }

    getContentIsProgressIds(): ContentId[] {
        return this.inProgressIds;
    }

    onLoadingStarted(listener: LoadingStartedListener) {
        this.loadingStartedListeners.push(listener);
    }

    private notifyLoadingStarted(checking: boolean) {
        this.loadingStartedListeners.forEach((listener) => {
            listener(checking);
        });
    }

    onLoadingFinished(listener: () => void) {
        this.loadingFinishedListeners.push(listener);
    }

    private notifyLoadingFinished() {
        this.loadingFinishedListeners.forEach((listener) => {
            listener();
        });
    }

    onLoadingFailed(listener: () => void) {
        this.loadingFailedListeners.push(listener);
    }

    private notifyLoadingFailed() {
        this.loadingFailedListeners.forEach((listener) => {
            listener();
        });
    }

    onItemsChanged(listener: (items: ContentSummaryAndCompareStatus[]) => void) {
        this.itemList.onItemsChanged(listener);
    }

    unItemsChanged(listener: (items: ContentSummaryAndCompareStatus[]) => void) {
        this.itemList.unItemsChanged(listener);
    }
}
