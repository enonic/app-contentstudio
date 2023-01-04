import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {CompareStatus} from '../content/CompareStatus';
import {ContentId} from '../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../event/EditContentEvent';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {GetDescendantsOfContentsRequest} from '../resource/GetDescendantsOfContentsRequest';
import {ResolvePublishDependenciesRequest} from '../resource/ResolvePublishDependenciesRequest';
import {ResolvePublishDependenciesResult} from '../resource/ResolvePublishDependenciesResult';
import {PublishDialogDependantList} from './PublishDialogDependantList';
import {PublishDialogItemList} from './PublishDialogItemList';

export class PublishProcessor {

    private itemList: PublishDialogItemList;

    private dependantList: PublishDialogDependantList;

    private excludedIds: ContentId[] = [];

    private dependantIds: ContentId[] = [];

    private invalidIds: ContentId[] = [];

    private inProgressIds: ContentId[] = [];

    private notPublishableIds: ContentId[] = [];

    private requiredIds: ContentId[] = [];

    private allPendingDelete: boolean;

    private ignoreItemsChanged: boolean;

    private ignoreDependantItemsChanged: boolean;

    private checkPublishable: boolean = true;

    private loadingStartedListeners: { (): void }[] = [];

    private loadingFinishedListeners: { (): void }[] = [];

    private loadingFailedListeners: { (): void }[] = [];

    private instanceId: number;

    private readonly reloadDependenciesDebounced: (resetDependantItems?: boolean, silent?: boolean) => void;

    private static debug: boolean = false;

    constructor(itemList: PublishDialogItemList, dependantList: PublishDialogDependantList) {
        this.instanceId = 0;
        this.itemList = itemList;
        this.dependantList = dependantList;
        this.reloadDependenciesDebounced = AppHelper.debounce(this.reloadPublishDependencies.bind(this), 100);

        this.initListeners();
    }

    private initListeners() {
        this.itemList.onItemsRemoved(() => {
            if (!this.ignoreItemsChanged) {
                this.reloadDependenciesDebounced(true, !this.itemList.isVisible());
            }
        });

        this.itemList.onItemsAdded((items) => {
            const newIds: string[] = items.map(item => item.getId());
            this.excludedIds = this.excludedIds.filter(id => newIds.indexOf(id.toString()) < 0);
            if (!this.ignoreItemsChanged) {
                this.reloadDependenciesDebounced(true, !this.itemList.isVisible());
            }
        });

        this.itemList.onChildrenListChanged(() => {
            this.reloadDependenciesDebounced(true, !this.itemList.isVisible());
        });

        const itemClickedFn = (item: ContentSummaryAndCompareStatus) => {
            new EditContentEvent([item]).fire();
        };

        this.itemList.onItemClicked(itemClickedFn);
        this.dependantList.onItemClicked(itemClickedFn);

        this.dependantList.onItemRemoveClicked((item: ContentSummaryAndCompareStatus) => {
            this.excludedIds.push(item.getContentId());
            this.reloadDependenciesDebounced(true, !this.dependantList.isVisible());
        });

        this.dependantList.onListChanged(() => {
            if (!this.ignoreDependantItemsChanged) {
                this.reloadDependenciesDebounced(true, !this.dependantList.isVisible());
            }
        });

        this.itemList.onItemsChanged(() => {
            this.reloadDependenciesDebounced(false);
        });
    }

    reloadPublishDependencies(resetDependantItems?: boolean, silent?: boolean): void {
        if (PublishProcessor.debug) {
            console.debug('PublishProcessor.reloadPublishDependencies: resetDependantItems = ' + resetDependantItems);
        }

        if (!silent) {
            this.notifyLoadingStarted();
        }

        const ids: ContentId[] = this.getContentToPublishIds();
        const noItemsToPublish: boolean = ids.length === 0;

        if (noItemsToPublish) {
            this.handleNoPublishItemsToLoad(resetDependantItems, silent);
        } else {
            this.loadPublishDependencies(ids, resetDependantItems, silent);
        }
    }

    private handleNoPublishItemsToLoad(resetDependantItems?: boolean, silent?: boolean) {
        this.dependantIds = [];
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

    private processResolveDescendantsResult(dependants: ContentSummaryAndCompareStatus[], resetDependantItems?: boolean) {
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

    private loadPublishDependencies(ids: ContentId[], resetDependantItems?: boolean, silent?: boolean) {
        const instanceId: number = this.instanceId;
        this.createResolveDependenciesRequest(ids).sendAndParse().then((result: ResolvePublishDependenciesResult) => {
            this.processResolveDependenciesResult(result);
            this.handleExclusionResult();

            return this.loadDescendants().then((descendants: ContentSummaryAndCompareStatus[]) => {
                if (instanceId === this.instanceId) {
                    this.processResolveDescendantsResult(descendants, resetDependantItems);
                    if (!silent) {
                        this.notifyLoadingFinished();
                    }
                }
            });
        }).catch((reason: any) => {
            if (instanceId === this.instanceId) {
                this.notifyLoadingFailed();
                DefaultErrorHandler.handle(reason);
            }
        });
    }

    private createResolveDependenciesRequest(ids: ContentId[]): ResolvePublishDependenciesRequest {
        return ResolvePublishDependenciesRequest.create()
            .setIds(ids)
            .setExcludedIds(this.excludedIds)
            .setExcludeChildrenIds(this.itemList.getExcludeChildrenIds())
            .build();
    }

    private processResolveDependenciesResult(result: ResolvePublishDependenciesResult) {
        if (PublishProcessor.debug) {
            console.debug('PublishProcessor.reloadPublishDependencies: resolved dependencies = ', result);
        }

        this.dependantIds = result.getDependants().slice();
        this.dependantList.setRequiredIds(result.getRequired());
        this.invalidIds = result.getInvalid();
        this.inProgressIds = result.getInProgress();
        this.requiredIds = result.getRequired();
        this.notPublishableIds = result.getNotPublishable();
        this.allPendingDelete = result.isAllPendingDelete();
    }

    private loadDescendants(): Q.Promise<ContentSummaryAndCompareStatus[]> {
        const noDependantItems: boolean = this.dependantIds.length === 0;

        if (noDependantItems) {
            return Q([]);
        }

        const slicedIds = this.dependantIds.slice(0, 0 + GetDescendantsOfContentsRequest.LOAD_SIZE);
        return new ContentSummaryAndCompareStatusFetcher().fetchByIds(slicedIds);
    }

    private handleExclusionResult(): void {
        const inProgressIds = this.getInProgressIdsWithoutInvalid();
        const invalidIds = this.getInvalidIds();
        if (this.isAnyExcluded(inProgressIds) || this.isAnyExcluded(invalidIds)) {
            NotifyManager.get().showFeedback(i18n('dialog.publish.notAllExcluded'));
        }
    }

    private itemsIncludeId(sourceIds: ContentId[], targetId: ContentId) {
        return sourceIds.some((sourceId: ContentId) => sourceId.equals(targetId));
    }

    private isAnyExcluded(ids: ContentId[]): boolean {
        if (this.excludedIds.length === 0) {
            return false;
        }

        return this.excludedIds.some((excludedId: ContentId) => this.itemsIncludeId(ids, excludedId));
    }

    public getInProgressCount(dependantOnly = false): number {
        const ids = this.getInProgressIdsWithoutInvalid();
        return dependantOnly ? ids.filter(id => this.itemsIncludeId(this.dependantIds, id)).length : ids.length;
    }

    public getInvalidCount(dependantOnly = false): number {
        const ids = this.getInvalidIds();
        return dependantOnly ? ids.filter(id => this.itemsIncludeId(this.dependantIds, id)).length : ids.length;
    }

    public getNotPublishableCount(dependantOnly = false): number {
        const ids = this.getNotPublishableIds();
        return dependantOnly ? ids.filter(id => this.itemsIncludeId(this.dependantIds, id)).length : ids.length;
    }

    private getExcludableFromIdsCount(ids: ContentId[]): number {
        return ids.filter(id => !this.itemsIncludeId(this.excludedIds, id) && this.itemsIncludeId(this.dependantIds, id)).length;
    }

    public canExcludeInProgress(): boolean {
        const inProgressTotal = this.getInProgressCount(true);
        return this.getExcludableFromIdsCount(this.getInProgressIdsWithoutInvalid()) === inProgressTotal && inProgressTotal > 0;
    }

    public canExcludeInvalid(): boolean {
        const invalidTotal = this.getInvalidCount(true);
        return this.getExcludableFromIdsCount(this.getInvalidIds()) === invalidTotal && invalidTotal > 0;
    }

    public canExcludeNotPublishable(): boolean {
        const notPublishableTotal = this.getNotPublishableCount(true);
        return this.getExcludableFromIdsCount(this.getNotPublishableIds()) === notPublishableTotal && notPublishableTotal > 0;
    }

    public reset(): void {
        this.instanceId += 1;
        this.itemList.setExcludeChildrenIds([]);
        this.itemList.setItems([]);
        this.itemList.setReadOnly(false);

        this.dependantList.setRequiredIds([]);
        this.dependantList.setItems([]);
        this.dependantList.setReadOnly(false);

        this.resetExcludedIds();
    }

    public getContentToPublishIds(): ContentId[] {
        return this.itemList.getItemsIds();
    }

    public countParent(): number {
        return this.countToPublish(this.itemList.getItems());
    }

    public countTotal(): number {
        return this.countParent() + this.dependantIds.length;
    }

    public isAllPublishable(): boolean {
        return this.notPublishableIds.length === 0;
    }

    public getNotPublishableIds(): ContentId[] {
        return this.notPublishableIds;
    }

    public isAllPendingDelete(): boolean {
        return this.allPendingDelete;
    }

    public containsInvalidItems(): boolean {
        return this.invalidIds.length > 0;
    }

    public getInvalidIds(): ContentId[] {
        return this.invalidIds;
    }

    public getInvalidIdsWithoutRequired(): ContentId[] {
        return this.invalidIds.filter((id: ContentId) => !this.itemsIncludeId(this.requiredIds, id));
    }

    public setCheckPublishable(flag: boolean) {
        this.checkPublishable = flag;
    }

    public isCheckPublishable(): boolean {
        return this.checkPublishable;
    }

    public areAllConditionsSatisfied(itemsToPublish: number): boolean {
        const allValid: boolean = !this.containsInvalidItems();
        const allPublishable: boolean = this.isAllPublishable();
        const containsItemsInProgress: boolean = this.containsItemsInProgress();
        return itemsToPublish > 0 && allValid && !containsItemsInProgress && (!this.checkPublishable || allPublishable);
    }

    public containsInvalidDependants(): boolean {
        return this.dependantList.getItems().some(item => !item.getContentSummary().isValid());
    }

    public containsItemsInProgress(): boolean {
        return this.inProgressIds.length > 0;
    }

    public getInProgressIds(): ContentId[] {
        return this.inProgressIds;
    }

    public getInProgressIdsWithoutInvalid(): ContentId[] {
        return this.inProgressIds.filter((id: ContentId) => !this.itemsIncludeId(this.invalidIds, id));
    }

    public getInProgressIdsWithoutInvalidAndRequired(): ContentId[] {
        return this.getInProgressIdsWithoutInvalid().filter((id: ContentId) => !this.itemsIncludeId(this.requiredIds, id));
    }

    public getDependantIds(): ContentId[] {
        return this.dependantIds;
    }

    public resetDependantIds() {
        this.dependantIds = [];
    }

    public getExcludedIds(): ContentId[] {
        return this.excludedIds;
    }

    public setExcludedIds(ids: ContentId[]) {
        this.excludedIds = !!ids ? ids : [];
    }

    public resetExcludedIds() {
        this.excludedIds = [];
    }

    public getExcludeChildrenIds(): ContentId[] {
        return this.itemList.getExcludeChildrenIds();
    }

    public setIgnoreItemsChanged(value: boolean) {
        this.ignoreItemsChanged = value;
    }

    public setIgnoreDependantItemsChanged(value: boolean) {
        this.ignoreDependantItemsChanged = value;
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
        ids.forEach(id => {
            const isAlreadyExcluded = excludedIds.indexOf(id.toString()) >= 0;
            if (!isAlreadyExcluded) {
                this.excludedIds.push(id);
                excludedIds.push(id.toString());
            }
        });

        this.itemList.removeItemsByIds(ids);
        this.reloadDependenciesDebounced(true);
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

    public getItemsTotalInProgress(): number {
        return this.inProgressIds.length;
    }

    public getContentIsProgressIds(): ContentId[] {
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

    public onItemsChanged(listener: (items: ContentSummaryAndCompareStatus[]) => void) {
        this.itemList.onItemsChanged(listener);
    }

    public unItemsChanged(listener: (items: ContentSummaryAndCompareStatus[]) => void) {
        this.itemList.unItemsChanged(listener);
    }
}
