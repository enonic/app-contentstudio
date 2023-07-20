import * as Q from 'q';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {OptionDataLoader, OptionDataLoaderData} from '@enonic/lib-admin-ui/ui/selector/OptionDataLoader';
import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';
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
import {ContentSelectorRequest} from '../../../resource/ContentSelectorRequest';
import {ListByIdSelectorRequest} from '../../../resource/ListByIdSelectorRequest';
import {Project} from '../../../settings/data/project/Project';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';

export class ContentSummaryOptionDataLoader<DATA extends ContentTreeSelectorItem>
    extends OptionDataLoader<DATA> {

    protected readonly project?: Project;

    protected readonly applicationKey: ApplicationKey;

    private readonly treeRequest: ContentTreeSelectorQueryRequest<DATA> | ListByIdSelectorRequest<DATA>;

    private readonly flatRequest: ContentSelectorQueryRequest<ContentSummaryJson, ContentSummary>;

    private isTreeLoadMode: boolean;

    private treeFilterValue: string;

    private loadModeChangedListeners: { (isTreeMode: boolean): void }[] = [];

    private readonly smartTreeMode: boolean;

    private readonly postFilterFn: (contentItem: ContentSummary | ContentTreeSelectorItem) => boolean = () => true;

    constructor(builder?: ContentSummaryOptionDataLoaderBuilder) {
        super();

        this.project = builder?.project;
        this.applicationKey = builder?.applicationKey;
        this.smartTreeMode = builder ? builder.smartTreeMode : true;

        this.flatRequest = new ContentSelectorQueryRequest().setRequestProject(this.project);
        this.treeRequest = this.smartTreeMode ? new ContentTreeSelectorQueryRequest<DATA>().setRequestProject(this.project) :
                           new ListByIdSelectorRequest<DATA>().setRequestProject(this.project);

        this.flatRequest.setApplicationKey(builder?.applicationKey);
        this.treeRequest.setApplicationKey(builder?.applicationKey);

        if (builder) {
            this.initRequests(builder);
            if (builder.postFilterFn) {
                this.postFilterFn = builder.postFilterFn;
            }
        }
    }

    load(postLoad: boolean = false): Q.Promise<DATA[]> {
        if (!this.isTreeLoadMode) {
            return this.sendAndParseFlatRequest(true, postLoad);
        }

        this.treeRequest.setContent(null);
        this.notifyLoadingData(postLoad);

        return this.loadItems().then((data: DATA[]) => {
            this.notifyLoadedData(data, postLoad);
            return data;
        });
    }

    initRequests(builder: ContentSummaryOptionDataLoaderBuilder) {
        this.initRequest(builder, this.treeRequest);
        this.initRequest(builder, this.flatRequest);
    }

    fetch(node: TreeNode<Option<DATA>>): Q.Promise<DATA> {
        this.treeRequest.setContent(node.getDataId() ? node.getData().getDisplayValue().getContent() : null);
        return this.loadItems().then(items => items[0]);
    }

    protected sendPreLoadRequest(ids: string): Q.Promise<DATA[]> {
        const contentIds = ids.split(';').map((id) => new ContentId(id));
        return new GetContentSummaryByIds(contentIds).setRequestProject(this.project).sendAndParse().then(((contents: ContentSummary[]) => {
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
            const result =
                contents.filter(this.postFilterFn).map(content => new ContentTreeSelectorItem(content));

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

    fetchChildren(parentNode: TreeNode<Option<DATA>>, from: number = 0,
                  size: number = -1): Q.Promise<OptionDataLoaderData<DATA>> {

        const postLoad: boolean = from > 0;

        if (parentNode.getRoot().getId() === parentNode.getId()) {
            this.notifyLoadingData(postLoad);
        }

        this.isTreeLoadMode = true;

        this.treeRequest.setFrom(from);
        this.treeRequest.setSize(size);

        this.treeRequest.setChildOrder(parentNode.getDataId() ? parentNode.getData().getDisplayValue().getContent().getChildOrder() : null);

        if (this.smartTreeMode) {
            (<ContentTreeSelectorQueryRequest<DATA>>this.treeRequest).setParentPath(
                parentNode.getDataId() ? parentNode.getData().getDisplayValue().getContent().getPath() : null);
        } else {
            this.treeRequest.setContent(parentNode.getDataId() ? parentNode.getData().getDisplayValue().getContent() : null);
        }

        this.treeRequest.setSearchString(this.treeFilterValue);

        return this.loadItems().then((result: DATA[]) => {
            result = result.filter(this.postFilterFn);

            this.notifyLoadedData([], postLoad, true);

            return this.createOptionData(result, this.treeRequest.getMetadata().getHits(),
                this.treeRequest.getMetadata().getTotalHits());
        });
    }

    protected createRequest(): ContentSelectorRequest<DATA> {
        return null;
    }

    private initRequest(builder: ContentSummaryOptionDataLoaderBuilder,
                        request: ContentSelectorRequest<DATA> | ContentSelectorQueryRequest<ContentSummaryJson, ContentSummary>) {
        if (this.smartTreeMode) {
            request.setContentTypeNames(builder.contentTypeNames);
            request.setAllowedContentPaths(builder.allowedContentPaths);
            request.setRelationshipType(builder.relationshipType);
        }
        request.setContent(builder.content);
    }

    protected createOptionData(data: DATA[], hits: number,
                               totalHits: number): OptionDataLoaderData<DATA> {
        return new OptionDataLoaderData<DATA>(data, hits, totalHits);
    }

    checkReadonly(items: DATA[]): Q.Promise<string[]> {
        return ContentSummaryFetcher.getReadOnly(items.map(item => item.getContent()));
    }

    private loadItems(): Q.Promise<DATA[]> {
        if (this.isTreeLoadMode) {
            return this.treeRequest.sendAndParse().then(items => {
                return this.loadStatuses(items);
            });
        }

        return Q([]);
    }

    private loadStatuses(contents: DATA[]): Q.Promise<DATA[]> {
        return CompareContentRequest.fromContentSummaries(contents.map(item => item.getContent())).setRequestProject(
            this.project).sendAndParse().then(
            (compareResults: CompareContentResults) => {

                return contents.map(item => {

                    const compareResult: CompareContentResult = compareResults.get(item.getId());
                    const contentAndCompareStatus = ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(
                        item.getContent(), compareResult.getCompareStatus(), compareResult.getPublishStatus());

                    return new ContentAndStatusTreeSelectorItem(contentAndCompareStatus, item.isSelectable()) as unknown as DATA;
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

    smartTreeMode: boolean = true;

    project: Project;

    applicationKey: ApplicationKey;

    postFilterFn: (contentItem: ContentSummary | ContentTreeSelectorItem) => boolean = () => true;

    setContentTypeNames(contentTypeNames: string[]): ContentSummaryOptionDataLoaderBuilder {
        this.contentTypeNames = contentTypeNames;
        return this;
    }

    setAllowedContentPaths(allowedContentPaths: string[]): ContentSummaryOptionDataLoaderBuilder {
        this.allowedContentPaths = allowedContentPaths;
        return this;
    }

    setRelationshipType(relationshipType: string): ContentSummaryOptionDataLoaderBuilder {
        this.relationshipType = relationshipType;
        return this;
    }

    setContent(content: ContentSummary): ContentSummaryOptionDataLoaderBuilder {
        this.content = content;
        return this;
    }

    setSmartTreeMode(smartTreeMode: boolean): ContentSummaryOptionDataLoaderBuilder {
        this.smartTreeMode = smartTreeMode;
        return this;
    }

    setProject(project: Project): ContentSummaryOptionDataLoaderBuilder {
        this.project = project;
        return this;
    }

    setApplicationKey(key: ApplicationKey): ContentSummaryOptionDataLoaderBuilder {
        this.applicationKey = key;
        return this;
    }

    setPostFilterFn(postFilterFn: (contentItem: ContentSummary | ContentTreeSelectorItem) => boolean): ContentSummaryOptionDataLoaderBuilder {
        this.postFilterFn = postFilterFn;
        return this;
    }

    build(): ContentSummaryOptionDataLoader<ContentTreeSelectorItem> {
        return new ContentSummaryOptionDataLoader(this);
    }
}
