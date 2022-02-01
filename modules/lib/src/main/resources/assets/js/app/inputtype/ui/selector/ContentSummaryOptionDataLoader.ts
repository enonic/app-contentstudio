import Q from 'q';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {OptionDataLoader, OptionDataLoaderData} from 'lib-admin-ui/ui/selector/OptionDataLoader';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {ContentTreeSelectorItem} from '../../../item/ContentTreeSelectorItem';
import {ContentAndStatusTreeSelectorItem} from '../../../item/ContentAndStatusTreeSelectorItem';
import {ContentTreeSelectorQueryRequest} from '../../../resource/ContentTreeSelectorQueryRequest';
import {ContentSelectorQueryRequest} from '../../../resource/ContentSelectorQueryRequest';
import {ContentSummaryFetcher} from '../../../resource/ContentSummaryFetcher';
import {CompareContentRequest} from '../../../resource/CompareContentRequest';
import {CompareContentResults} from '../../../resource/CompareContentResults';
import {CompareContentResult} from '../../../resource/CompareContentResult';
import {GetContentSummaryByIds} from '../../../resource/GetContentSummaryByIds';
import {ContentSummaryAndCompareStatus} from '../../../content/ContentSummaryAndCompareStatus';
import {ContentSummary} from '../../../content/ContentSummary';
import {ContentId} from '../../../content/ContentId';
import {ContentSummaryJson} from '../../../content/ContentSummaryJson';

export class ContentSummaryOptionDataLoader<DATA extends ContentTreeSelectorItem>
    extends OptionDataLoader<DATA> {

    private treeRequest: ContentTreeSelectorQueryRequest<DATA>;

    private flatRequest: ContentSelectorQueryRequest<ContentSummaryJson, ContentSummary>;

    private isTreeLoadMode: boolean;

    private treeFilterValue: string;

    private loadModeChangedListeners: { (isTreeMode: boolean): void }[] = [];

    constructor(builder?: ContentSummaryOptionDataLoaderBuilder) {
        super();

        if (builder) {
            this.initRequests(builder);
        }
    }

    protected createRequest(): ContentTreeSelectorQueryRequest<DATA> {

        this.flatRequest = new ContentSelectorQueryRequest();
        this.treeRequest = new ContentTreeSelectorQueryRequest<DATA>();

        return this.treeRequest;
    }

    private initRequests(builder: ContentSummaryOptionDataLoaderBuilder) {
        this.initRequest(builder, this.treeRequest);
        this.initRequest(builder, this.flatRequest);
    }

    private initRequest(builder: ContentSummaryOptionDataLoaderBuilder,
                        request: ContentTreeSelectorQueryRequest<DATA> | ContentSelectorQueryRequest<ContentSummaryJson, ContentSummary>) {
        request.setContentTypeNames(builder.contentTypeNames);
        request.setAllowedContentPaths(builder.allowedContentPaths);
        request.setRelationshipType(builder.relationshipType);
        request.setContent(builder.content);
    }

    protected sendPreLoadRequest(ids: string): Q.Promise<DATA[]> {
        const contentIds = ids.split(';').map((id) => new ContentId(id));
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

    private sendAndParseFlatRequest(silent: boolean = false, postLoad?: boolean): Q.Promise<DATA[]> {
        return this.flatRequest.sendAndParse().then((contents) => {
            const result = contents.map(content => new ContentTreeSelectorItem(content));

            if (!silent) {
                this.isTreeLoadMode = false;
                this.notifyLoadModeChanged(false);
            }

            return this.loadStatuses(<DATA[]>result).then(resultWithStatuses => {
                this.notifyLoadedData(resultWithStatuses, postLoad);
                return resultWithStatuses;
            });
        });
    }

    search(value: string): Q.Promise<DATA[]> {

        this.notifyLoadingData();

        this.flatRequest.resetParams();

        this.flatRequest.setInputName(this.treeRequest.getInputName());
        this.flatRequest.setSearchString(value);

        return this.sendAndParseFlatRequest();
    }

    load(postLoad: boolean = false): Q.Promise<DATA[]> {

        if (!this.isTreeLoadMode) {
            return this.sendAndParseFlatRequest(true, postLoad);
        }

        this.treeRequest.setParentContent(null);
        this.notifyLoadingData(postLoad);
        return this.loadItems().then(data => {

            this.notifyLoadedData(data, postLoad);
            return data;
        });
    }

    fetch(node: TreeNode<Option<DATA>>): Q.Promise<DATA> {
        this.treeRequest.setParentContent(node.getDataId() ? node.getData().getDisplayValue().getContent() : null);
        return this.loadItems().then(items => items[0]);
    }

    fetchChildren(parentNode: TreeNode<Option<DATA>>, from: number = 0,
                  size: number = -1): Q.Promise<OptionDataLoaderData<DATA>> {

        const postLoad: boolean = from > 0;

        if (parentNode.getRoot().getId() === parentNode.getId()) {
            this.notifyLoadingData(postLoad);
        }

        this.isTreeLoadMode = true;

        this.treeRequest.setFrom(from);
        this.treeRequest.setSize(size);

        this.treeRequest.setParentContent(parentNode.getDataId() ? parentNode.getData().getDisplayValue().getContent() : null);

        this.treeRequest.setSearchString(this.treeFilterValue);

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

    checkReadonly(items: DATA[]): Q.Promise<string[]> {
        return ContentSummaryFetcher.getReadOnly(items.map(item => item.getContent()));
    }

    private loadItems(): Q.Promise<DATA[]> {
        return this.request.sendAndParse().then(items => {
            return this.loadStatuses(items);
        });
    }

    private loadStatuses(contents: DATA[]): Q.Promise<DATA[]> {
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

    build(): ContentSummaryOptionDataLoader<ContentTreeSelectorItem> {
        return new ContentSummaryOptionDataLoader(this);
    }
}
