import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {CompareStatus} from '../content/CompareStatus';
import {ContentId} from '../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {SelectionType} from '../dialog/DialogDependantItemsList';
import {EditContentEvent} from '../event/EditContentEvent';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
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

    private allPendingDelete: boolean;

    private loadExcluded: boolean = false;

    private ignoreItemsChanged: boolean;

    private ignoreDependantItemsChanged: boolean;

    private checkPublishable: boolean = true;

    private ignoreSilent?: boolean = false;

    private loadingStartedListeners: (() => void)[] = [];

    private loadingFinishedListeners: (() => void)[] = [];

    private loadingFailedListeners: (() => void)[] = [];

    private instanceId: number;

    readonly reloadDependenciesDebounced: (params: ReloadDependenciesParams) => void;

    private static debug: boolean = false;

    constructor(itemList: PublishDialogItemList, dependantList: PublishDialogDependantList) {
        this.instanceId = 0;
        this.itemList = itemList;
        this.dependantList = dependantList;
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
                resetExclusions: childrenRemoved,
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
                case SelectionType.NONE:
                    this.setExcludedIds(this.allDependantIds);
                    break;
                case SelectionType.ALL:
                    this.setExcludedIds([]);
                    break;
                case SelectionType.PARTIAL: {
                    const sortedExcludedIds = this.allDependantIds.filter(id => {
                        return this.dependantList.getExcludedIds().some(excludedId => excludedId.equals(id));
                    });
                    this.setExcludedIds(sortedExcludedIds);
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

    reloadPublishDependencies({resetDependantItems, resetExclusions, silent}: ReloadDependenciesParams): void {
        if (!silent) {
            this.notifyLoadingStarted();
        }

        const ids = this.getContentToPublishIds();
        const isNoItemsToPublish = ids.length === 0;

        if (resetExclusions) {
            this.resetExcludedIds();
        }

        if (isNoItemsToPublish) {
            this.handleNoPublishItemsToLoad(resetDependantItems, silent);
        } else {
            this.loadPublishDependencies(ids, resetDependantItems, silent);
        }
    }

    private handleNoPublishItemsToLoad(resetDependantItems?: boolean, silent?: boolean): void {
        this.dependantIds = [];
        this.allDependantIds = [];
        this.dependantList.setRequiredIds([]);
        this.inProgressIds = [];
        this.invalidIds = [];
        this.requiredIds = [];
        this.notPublishableIds = [];
        this.allPendingDelete = false;

        this.processResolveDescendantsResult([], resetDependantItems);

        if (!silent) {
            this.notifyLoadingFinished();
        }
    }

    private processResolveDescendantsResult(dependants: ContentSummaryAndCompareStatus[], resetDependantItems?: boolean): void {
        if (PublishProcessor.debug) {
            console.debug('PublishProcessor.reloadPublishDependencies: resolved dependants = ', dependants);
        }

        if (resetDependantItems) { // just opened or first time loading children
            this.dependantList.setItems(dependants);
        } else {
            this.filterDependantItems(dependants);
        }

        this.dependantList.refresh();
    }

    private loadPublishDependencies(ids: ContentId[], resetDependantItems?: boolean, silent?: boolean): void {
        const instanceId: number = this.instanceId;
        this.createResolveDependenciesRequest(ids, this.getExcludedIds()).sendAndParse()
            .then((result: ResolvePublishDependenciesResult) => {
                this.processResolveDependenciesResult(result);
                this.handleExclusionResult();
            }).then(() => {
            const hasExcluded = this.getExcludedIds().length > 0;
            if (hasExcluded) {
                return this.createResolveDependenciesRequest(ids, []).sendAndParse().then((result: ResolvePublishDependenciesResult) => {
                    this.allDependantIds = result.getDependants().slice();
                });
            } else {
                this.allDependantIds = this.dependantIds.slice();
            }
        }).then(() => {
            return this.loadDescendants().then((descendants: ContentSummaryAndCompareStatus[]) => {
                if (instanceId === this.instanceId) {
                    this.processResolveDescendantsResult(descendants, resetDependantItems);
                    if (!silent) {
                        this.notifyLoadingFinished();
                    }
                }
            });
        }).catch((reason) => {
            if (instanceId === this.instanceId) {
                this.notifyLoadingFailed();
                DefaultErrorHandler.handle(reason);
            }
        });
    }

    private createResolveDependenciesRequest(ids: ContentId[], excludedIds: ContentId[]): ResolvePublishDependenciesRequest {
        return ResolvePublishDependenciesRequest.create()
            .setIds(ids)
            .setExcludedIds(excludedIds)
            .setExcludeChildrenIds(this.itemList.getExcludeChildrenIds())
            .build();
    }

    private processResolveDependenciesResult(result: ResolvePublishDependenciesResult): void {
        this.dependantIds = result.getDependants().slice();
        this.dependantList.setRequiredIds(result.getRequired());
        this.invalidIds = result.getInvalid();
        this.inProgressIds = result.getInProgress();
        this.requiredIds = result.getRequired();
        this.notPublishableIds = result.getNotPublishable();
        this.allPendingDelete = result.isAllPendingDelete();
    }

    private loadDescendants(): Q.Promise<ContentSummaryAndCompareStatus[]> {
        const dependantsIds = this.getDependantIds(this.loadExcluded);
        const noDependantItems = dependantsIds.length === 0;

        if (noDependantItems) {
            return Q([]);
        }

        const slicedIds = dependantsIds.slice(0, GetDescendantsOfContentsRequest.LOAD_SIZE);
        return new ContentSummaryAndCompareStatusFetcher().fetchByIds(slicedIds);
    }

    private handleExclusionResult(): void {
        const inProgressIds = this.getInProgressIdsWithoutInvalid();
        const invalidIds = this.getInvalidIds();
        if (this.isAnyExcluded(inProgressIds) || this.isAnyExcluded(invalidIds)) {
            NotifyManager.get().showFeedback(i18n('dialog.publish.notAllExcluded'));
        }
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
        return ids.filter(id => !this.itemsIncludeId(this.getExcludedIds(), id) && this.itemsIncludeId(this.dependantIds, id)).length;
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
        this.itemList.setExcludeChildrenIds([]);
        this.itemList.setItems([]);
        this.itemList.setReadOnly(false);

        this.dependantList.setRequiredIds([]);
        this.dependantList.setItems([]);
        this.dependantList.setReadOnly(false);

        this.resetExcludedIds();
    }

    getContentToPublishIds(): ContentId[] {
        return this.itemList.getItemsIds();
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

    isAllPendingDelete(): boolean {
        return this.allPendingDelete;
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

    resetDependantIds(): void {
        this.dependantIds = [];
        this.allDependantIds = [];
    }

    getExcludedIds(): ContentId[] {
        return this.excludedIds;
    }

    setExcludedIds(ids: ContentId[]) {
        this.excludedIds = ids ?? [];
        this.dependantList.setExcludedIds(this.excludedIds);
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

    isLoadExcluded(): boolean {
        return this.loadExcluded;
    }

    setLoadExcluded(loadExcluded: boolean) {
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

    onLoadingStarted(listener: () => void) {
        this.loadingStartedListeners.push(listener);
    }

    unLoadingStarted(listener: () => void) {
        this.loadingStartedListeners = this.loadingStartedListeners.filter((curr) => {
            return listener !== curr;
        });
    }

    private notifyLoadingStarted() {
        this.loadingStartedListeners.forEach((listener) => {
            listener();
        });
    }

    onLoadingFinished(listener: () => void) {
        this.loadingFinishedListeners.push(listener);
    }

    unLoadingFinished(listener: () => void) {
        this.loadingFinishedListeners = this.loadingFinishedListeners.filter((curr) => {
            return listener !== curr;
        });
    }

    private notifyLoadingFinished() {
        this.loadingFinishedListeners.forEach((listener) => {
            listener();
        });
    }

    onLoadingFailed(listener: () => void) {
        this.loadingFailedListeners.push(listener);
    }

    unLoadingFailed(listener: () => void) {
        this.loadingFailedListeners = this.loadingFailedListeners.filter((curr) => {
            return listener !== curr;
        });
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
