import {PublishDialogItemList} from './PublishDialogItemList';
import {PublishDialogDependantList} from './PublishDialogDependantList';
import {ResolvePublishDependenciesRequest} from '../resource/ResolvePublishDependenciesRequest';
import {GetDescendantsOfContentsRequest} from '../resource/GetDescendantsOfContentsRequest';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {ResolvePublishDependenciesResult} from '../resource/ResolvePublishDependenciesResult';
import {EditContentEvent} from '../event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {CompareStatus} from '../content/CompareStatus';
import ContentId = api.content.ContentId;

export class PublishProcessor {

    private itemList: PublishDialogItemList;

    private dependantList: PublishDialogDependantList;

    private excludedIds: ContentId[] = [];

    private dependantIds: ContentId[] = [];

    private containsInvalid: boolean;

    private allPublishable: boolean;

    private ignoreItemsChanged: boolean;

    private ignoreDependantItemsChanged: boolean;

    private loadingStartedListeners: { (): void }[] = [];

    private loadingFinishedListeners: { (): void }[] = [];

    private loadingFailedListeners: { (): void }[] = [];

    private reloadDependenciesDebounced: Function;

    private static debug: boolean = false;

    constructor(itemList: PublishDialogItemList, dependantList: PublishDialogDependantList) {
        this.itemList = itemList;
        this.dependantList = dependantList;
        this.reloadDependenciesDebounced = api.util.AppHelper.debounce(this.reloadPublishDependencies.bind(this), 100);

        this.initListeners();
    }

    private initListeners() {
        this.itemList.onItemsRemoved(() => {
            if (!this.ignoreItemsChanged) {
                this.reloadDependenciesDebounced();
            }
        });

        this.itemList.onItemsAdded((items) => {
            const newIds: string[] = items.map(item => item.getId());
            this.excludedIds = this.excludedIds.filter(id => newIds.indexOf(id.toString()) < 0);
            if (!this.ignoreItemsChanged) {
                this.reloadDependenciesDebounced(true);
            }
        });

        this.itemList.onChildrenListChanged(() => {
            this.reloadDependenciesDebounced(true);
        });

        const itemClickedFn = (item: ContentSummaryAndCompareStatus) => {
            new EditContentEvent([item]).fire();
        };

        this.itemList.onItemClicked(itemClickedFn);
        this.dependantList.onItemClicked(itemClickedFn);

        this.dependantList.onItemRemoveClicked((item: ContentSummaryAndCompareStatus) => {
            this.excludedIds.push(item.getContentId());
            this.reloadDependenciesDebounced();
        });

        this.dependantList.onListChanged(() => {
            if (!this.ignoreDependantItemsChanged) {
                this.reloadDependenciesDebounced(true);
            }
        });
    }

    reloadPublishDependencies(resetDependantItems?: boolean) {
        if (PublishProcessor.debug) {
            console.debug('PublishProcessor.reloadPublishDependencies: resetDependantItems = ' + resetDependantItems);
        }

        this.notifyLoadingStarted();

        const ids: ContentId[] = this.getContentToPublishIds();
        const noItemsToPublish: boolean = ids.length === 0;

        if (noItemsToPublish) {
            this.handleNoPublishItemsToLoad(resetDependantItems);
        } else {
            this.loadPublishDependencies(ids, resetDependantItems);
        }
    }

    private handleNoPublishItemsToLoad(resetDependantItems?: boolean) {
        this.dependantIds = [];
        this.dependantList.setRequiredIds([]);
        this.containsInvalid = false;
        this.allPublishable = false;

        this.processResolveDescendantsResult([], resetDependantItems);

        this.notifyLoadingFinished();
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

    private loadPublishDependencies(ids: ContentId[], resetDependantItems?: boolean) {
        this.createResolveDependenciesRequest(ids).sendAndParse().then((result: ResolvePublishDependenciesResult) => {
            this.processResolveDependenciesResult(result);

            return this.loadDescendants().then((descendants: ContentSummaryAndCompareStatus[]) => {
                this.processResolveDescendantsResult(descendants, resetDependantItems);
                this.notifyLoadingFinished();
            });
        }).catch((reason: any) => {
            this.notifyLoadingFailed();
            api.DefaultErrorHandler.handle(reason);
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
        this.containsInvalid = result.isContainsInvalid();
        this.allPublishable = result.isAllPublishable();
    }

    private loadDescendants(): wemQ.Promise<ContentSummaryAndCompareStatus[]> {
        const noDependantItems: boolean = this.dependantIds.length === 0;

        if (noDependantItems) {
            return wemQ([]);
        }

        const slicedIds = this.dependantIds.slice(0, 0 + GetDescendantsOfContentsRequest.LOAD_SIZE);
        return ContentSummaryAndCompareStatusFetcher.fetchByIds(slicedIds);
    }

    public reset() {
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

    public countTotal(): number {
        return this.countToPublish(this.itemList.getItems()) + this.dependantIds.length;
    }

    public isAllPublishable() {
        return this.allPublishable;
    }

    public containsInvalidItems() {
        return this.containsInvalid;
    }

    public containsInvalidDependants(): boolean {
        return this.dependantList.getItems().some(item => !item.getContentSummary().isValid());
    }

    public containsItemsInProgress(): boolean {
        return this.itemList.getItems().some(this.isOfflineItemInProgress) || this.dependantList.getItems().some(this.isItemInProgress);
    }

    private isOfflineItemInProgress(item: ContentSummaryAndCompareStatus): boolean {
        return !item.isOnline() && item.getContentSummary().isValid() && item.getContentSummary().isInProgress();
    }

    private isItemInProgress(item: ContentSummaryAndCompareStatus): boolean {
        return item.getContentSummary().isValid() && item.getContentSummary().isInProgress();
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

}
