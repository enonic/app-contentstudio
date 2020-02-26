import * as Q from 'q';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {ImageContentLoader} from './ImageContentLoader';
import {MediaTreeSelectorItem} from '../media/MediaTreeSelectorItem';
import {ContentSummaryOptionDataLoader, ContentSummaryOptionDataLoaderBuilder} from '../ContentSummaryOptionDataLoader';
import {ContentTreeSelectorItem} from '../../../../item/ContentTreeSelectorItem';
import {OptionDataLoaderData} from 'lib-admin-ui/ui/selector/OptionDataLoader';

export class ImageOptionDataLoader
    extends ContentSummaryOptionDataLoader<MediaTreeSelectorItem> {

    private preloadedDataListeners: { (data: MediaTreeSelectorItem[]): void }[] = [];

    fetch(node: TreeNode<Option<MediaTreeSelectorItem>>): Q.Promise<MediaTreeSelectorItem> {
        return super.fetch(node).then((data) => {
            return this.wrapItem(data);
        });
    }

    fetchChildren(parentNode: TreeNode<Option<MediaTreeSelectorItem>>, from: number = 0,
                  size: number = -1): Q.Promise<OptionDataLoaderData<MediaTreeSelectorItem>> {
        return super.fetchChildren(parentNode, from, size).then((data: OptionDataLoaderData<ContentTreeSelectorItem>) => {
                return this.createOptionData(data.getData(), data.getHits(), data.getTotalHits());
            }
        );
    }

    protected sendPreLoadRequest(ids: string): Q.Promise<MediaTreeSelectorItem[]> {
        let contentIds = ids.split(';').map((id) => {
            return new ContentId(id);
        });

        return ImageContentLoader.queueContentLoadRequest(contentIds)
            .then(((contents: ContentSummary[]) => {
                const data = contents.map(content => new MediaTreeSelectorItem(content, false));
                this.notifyPreloadedData(data);
                return data;
            }));
    }

    onPreloadedData(listener: (data: MediaTreeSelectorItem[]) => void) {
        this.preloadedDataListeners.push(listener);
    }

    unPreloadedData(listener: (data: MediaTreeSelectorItem[]) => void) {
        this.preloadedDataListeners = this.preloadedDataListeners.filter((currentListener: (data: MediaTreeSelectorItem[]) => void) => {
            return currentListener !== listener;
        });
    }

    notifyPreloadedData(data: MediaTreeSelectorItem[]) {
        this.preloadedDataListeners.forEach((listener: (data: MediaTreeSelectorItem[]) => void) => {
            listener.call(this, data);
        });
    }

    protected createOptionData(data: ContentTreeSelectorItem[], hits: number, totalHits: number) {
        return new OptionDataLoaderData(this.wrapItems(data),
            hits,
            totalHits);
    }

    notifyLoadedData(data: ContentTreeSelectorItem[] = [], postLoad?: boolean, silent: boolean = false) {
        const items = this.wrapItems(data);

        super.notifyLoadedData(items, postLoad, silent);
    }

    private wrapItems(items: ContentTreeSelectorItem[] = []): MediaTreeSelectorItem[] {
        return items.map(item =>
            new MediaTreeSelectorItem(item.getContent(), item.isSelectable(), item.isExpandable())
        );
    }

    private wrapItem(item: ContentTreeSelectorItem): MediaTreeSelectorItem {
        return item ? new MediaTreeSelectorItem(item.getContent(), item.isSelectable(), item.isExpandable()) : null;
    }

    static create(): ImageOptionDataLoaderBuilder {
        return new ImageOptionDataLoaderBuilder();
    }
}

export class ImageOptionDataLoaderBuilder
    extends ContentSummaryOptionDataLoaderBuilder {

    inputName: string;

    public setInputName(value: string): ImageOptionDataLoaderBuilder {
        this.inputName = value;
        return this;
    }

    setContentTypeNames(value: string[]): ImageOptionDataLoaderBuilder {
        super.setContentTypeNames(value);
        return this;
    }

    public setAllowedContentPaths(value: string[]): ImageOptionDataLoaderBuilder {
        super.setAllowedContentPaths(value);
        return this;
    }

    public setRelationshipType(value: string): ImageOptionDataLoaderBuilder {
        super.setRelationshipType(value);
        return this;
    }

    public setContent(value: ContentSummary): ImageOptionDataLoaderBuilder {
        super.setContent(value);
        return this;
    }

    build(): ImageOptionDataLoader {
        return new ImageOptionDataLoader(this);
    }
}
