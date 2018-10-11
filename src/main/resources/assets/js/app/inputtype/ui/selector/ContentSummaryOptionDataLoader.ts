import OptionDataLoader = api.ui.selector.OptionDataLoader;
import TreeNode = api.ui.treegrid.TreeNode;
import OptionDataLoaderData = api.ui.selector.OptionDataLoaderData;
import Option = api.ui.selector.Option;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import ContentSummary = api.content.ContentSummary;
import ContentId = api.content.ContentId;
import {ContentTreeSelectorItem} from '../../../item/ContentTreeSelectorItem';
import {ContentAndStatusTreeSelectorItem} from '../../../item/ContentAndStatusTreeSelectorItem';
import {ContentTreeSelectorQueryRequest} from '../../../resource/ContentTreeSelectorQueryRequest';
import {ContentSelectorQueryRequest} from '../../../resource/ContentSelectorQueryRequest';
import {ContentSummaryFetcher} from '../../../resource/ContentSummaryFetcher';
import {CompareContentRequest} from '../../../resource/CompareContentRequest';
import {CompareContentResults} from '../../../resource/CompareContentResults';
import {CompareContentResult} from '../../../resource/CompareContentResult';
import {GetContentSummaryByIds} from '../../../resource/GetContentSummaryByIds';

export class ContentSummaryOptionDataLoader<DATA extends ContentTreeSelectorItem>
    extends OptionDataLoader<DATA> {

    protected treeRequest: ContentTreeSelectorQueryRequest<DATA>;

    protected flatRequest: ContentSelectorQueryRequest;

    protected isTreeLoadMode: boolean;

    private treeFilterValue: string;

    private loadStatus: boolean;

    private loadModeChangedListeners: { (isTreeMode: boolean): void }[] = [];

    constructor(builder?: ContentSummaryOptionDataLoaderBuilder) {
        super();

        if (builder) {
            this.loadStatus = builder.loadStatus;

            this.initRequest(builder);
        }
    }

    protected createRequest(): ContentTreeSelectorQueryRequest<DATA> {

        this.flatRequest = new ContentSelectorQueryRequest();
        this.treeRequest = new ContentTreeSelectorQueryRequest<DATA>();

        return this.treeRequest;
    }

    private initRequest(builder: ContentSummaryOptionDataLoaderBuilder) {
        this.treeRequest.setContentTypeNames(builder.contentTypeNames);
        this.treeRequest.setAllowedContentPaths(builder.allowedContentPaths);
        this.treeRequest.setRelationshipType(builder.relationshipType);
        this.treeRequest.setContent(builder.content);

        this.flatRequest.setContentTypeNames(builder.contentTypeNames);
        this.flatRequest.setAllowedContentPaths(builder.allowedContentPaths);
        this.flatRequest.setRelationshipType(builder.relationshipType);
        this.flatRequest.setContent(builder.content);
    }

    protected sendPreLoadRequest(ids: string): Q.Promise<DATA[]> {
        let contentIds = ids.split(';').map((id) => {
            return new ContentId(id);
        });
        return new GetContentSummaryByIds(contentIds).sendAndParse().then(((contents: ContentSummary[]) => {
            return <DATA[]>contents.map(content => new ContentTreeSelectorItem(content));
        }));
    }

    setContent(content: ContentSummary) {
        this.treeRequest.setContent(content);
        this.flatRequest.setContent(content);
    }

    setTreeFilterValue(value: string) {
        this.treeFilterValue = value;
    }

    private sendAndParseFlatRequest(silent: boolean = false, postLoad?: boolean): wemQ.Promise<DATA[]> {
        return this.flatRequest.sendAndParse().then((contents) => {
            const result = contents.map(
                content => new ContentTreeSelectorItem(content));

            if (!silent) {
                this.isTreeLoadMode = false;
                this.notifyLoadModeChanged(false);
            }

            if (this.loadStatus) {
                return this.loadStatuses(<DATA[]>result).then(resultWithStatuses => {
                    this.notifyLoadedData(resultWithStatuses, postLoad);
                    return resultWithStatuses;
                });
            } else {
                this.notifyLoadedData(<DATA[]>result, postLoad);
                return wemQ(<DATA[]>result);
            }
        });
    }

    search(value: string): wemQ.Promise<DATA[]> {

        this.notifyLoadingData();

        this.flatRequest.resetParams();

        this.flatRequest.setInputName(this.treeRequest.getInputName());
        this.flatRequest.setQueryExpr(value);

        return this.sendAndParseFlatRequest();
    }

    load(postLoad: boolean = false): wemQ.Promise<DATA[]> {
        if (this.isTreeLoadMode) {

            this.treeRequest.setParentContent(null);
            this.notifyLoadingData(postLoad);
            return this.loadItems().then(data => {

                this.notifyLoadedData(data, postLoad);
                return data;
            });
        } else {
            return this.sendAndParseFlatRequest(true, postLoad);
        }
    }

    fetch(node: TreeNode<Option<DATA>>): wemQ.Promise<DATA> {
        this.treeRequest.setParentContent(node.getDataId() ? node.getData().displayValue.getContent() : null);
        return this.loadItems().then(items => items[0]);
    }

    fetchChildren(parentNode: TreeNode<Option<DATA>>, from: number = 0,
                  size: number = -1): wemQ.Promise<OptionDataLoaderData<DATA>> {

        const postLoad: boolean = from > 0;

        if (parentNode.getRoot().getId() === parentNode.getId()) {
            this.notifyLoadingData(postLoad);
        }

        this.isTreeLoadMode = true;

        this.treeRequest.setFrom(from);
        this.treeRequest.setSize(size);

        this.treeRequest.setParentContent(parentNode.getDataId() ? parentNode.getData().displayValue.getContent() : null);

        this.treeRequest.setQueryExpr(this.treeFilterValue);

        return this.loadItems().then((result: DATA[]) => {
            this.notifyLoadedData([], postLoad, true);

            return this.createOptionData(result, this.treeRequest.getMetadata().getHits(),
                this.treeRequest.getMetadata().getTotalHits());
        });
    }

    protected createOptionData(data: DATA[], hits: number,
                               totalHits: number): OptionDataLoaderData<DATA> {
        return new OptionDataLoaderData<DATA>(data, hits, totalHits);
    }

    checkReadonly(items: DATA[]): wemQ.Promise<string[]> {
        return ContentSummaryFetcher.getReadOnly(items.map(item => item.getContent()));
    }

    private loadItems(): wemQ.Promise<DATA[]> {
        return this.request.sendAndParse().then(items => {
            if (this.loadStatus) {
                return this.loadStatuses(items);
            }

            const deferred = wemQ.defer<DATA[]>();

            deferred.resolve(items.map((item: DATA) => {
                return <any>new ContentTreeSelectorItem(item.getContent(), item.isSelectable(), item.isExpandable());
            }));

            return deferred.promise;
        });
    }

    private loadStatuses(contents: DATA[]): wemQ.Promise<DATA[]> {
        return CompareContentRequest.fromContentSummaries(contents.map(item => item.getContent())).sendAndParse().then(
            (compareResults: CompareContentResults) => {

                return contents.map(item => {

                    const compareResult: CompareContentResult = compareResults.get(item.getId());
                    const contentAndCompareStatus = ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(
                        item.getContent(), compareResult.getCompareStatus(), compareResult.getPublishStatus());

                    return <any>new ContentAndStatusTreeSelectorItem(contentAndCompareStatus, item.isSelectable());
                });
            });
    }

    private notifyLoadModeChanged(isTreeMode: boolean) {
        this.loadModeChangedListeners.forEach((listener: (isTreeMode: boolean) => void) => {
            listener(isTreeMode);
        });
    }

    onLoadModeChanged(listener: (isTreeMode: boolean) => void) {
        this.loadModeChangedListeners.push(listener);
    }

    unLoadModeChanged(listener: (isTreeMode: boolean) => void) {
        this.loadModeChangedListeners = this.loadModeChangedListeners
            .filter(function (curr: (isTreeMode: boolean) => void) {
                return curr !== listener;
            });
    }

    static create(): ContentSummaryOptionDataLoaderBuilder {
        return new ContentSummaryOptionDataLoaderBuilder();
    }

    resetParams() {
        this.isTreeLoadMode ? this.treeRequest.resetParams() : this.flatRequest.resetParams();
    }

    isPartiallyLoaded(): boolean {
        return this.isTreeLoadMode ? this.treeRequest.isPartiallyLoaded() : this.flatRequest.isPartiallyLoaded();
    }
}

export class ContentSummaryOptionDataLoaderBuilder {

    content: ContentSummary;

    contentTypeNames: string[] = [];

    allowedContentPaths: string[] = [];

    relationshipType: string;

    loadStatus: boolean;

    public setContentTypeNames(contentTypeNames: string[]): ContentSummaryOptionDataLoaderBuilder {
        this.contentTypeNames = contentTypeNames;
        return this;
    }

    public setAllowedContentPaths(allowedContentPaths: string[]): ContentSummaryOptionDataLoaderBuilder {
        this.allowedContentPaths = allowedContentPaths;
        return this;
    }

    public setRelationshipType(relationshipType: string): ContentSummaryOptionDataLoaderBuilder {
        this.relationshipType = relationshipType;
        return this;
    }

    public setContent(content: ContentSummary): ContentSummaryOptionDataLoaderBuilder {
        this.content = content;
        return this;
    }

    public setLoadStatus(value: boolean): ContentSummaryOptionDataLoaderBuilder {
        this.loadStatus = value;
        return this;
    }

    build(): ContentSummaryOptionDataLoader<ContentTreeSelectorItem> {
        return new ContentSummaryOptionDataLoader(this);
    }
}
