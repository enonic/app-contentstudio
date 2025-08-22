import * as Q from 'q';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {OptionDataLoaderData} from '@enonic/lib-admin-ui/ui/selector/OptionDataLoader';
import {ContentId} from '../../../../content/ContentId';
import {ContentSummary} from '../../../../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentTreeSelectorItem} from '../../../../item/ContentTreeSelectorItem';
import {ContentSummaryOptionDataLoader, ContentSummaryOptionDataLoaderBuilder} from '../ContentSummaryOptionDataLoader';
import {MediaTreeSelectorItem} from '../media/MediaTreeSelectorItem';
import {ImageContentLoader} from './ImageContentLoader';

export class ImageOptionDataLoader
    extends ContentSummaryOptionDataLoader<MediaTreeSelectorItem> {

    constructor(builder: ImageOptionDataLoaderBuilder = new ImageOptionDataLoaderBuilder()) {
        super(builder);
    }

    fetchChildren(option: Option<ContentTreeSelectorItem>, from: number = 0,
                  size: number = -1): Q.Promise<OptionDataLoaderData<MediaTreeSelectorItem>> {
        return super.fetchChildren(option, from, size).then((data: OptionDataLoaderData<ContentTreeSelectorItem>) => {
                return this.createOptionData(data.getData(), data.getHits(), data.getTotalHits());
            }
        );
    }

    protected sendPreLoadRequest(ids: string): Q.Promise<MediaTreeSelectorItem[]> {
        const contentIds: ContentId[] = ids.split(';').map((id) => {
            return new ContentId(id);
        });

        return ImageContentLoader.queueContentLoadRequest(contentIds).then(((contents: ContentSummary[]) => {
            const missingItems: string[] = contentIds.map((contentId: ContentId) => contentId.toString()).filter((id: string) => {
                return !contents.some((content: ContentSummary) => content && content.getId() === id);
            });

            const items: MediaTreeSelectorItem[] = contents.map(content => {
                const item: MediaTreeSelectorItem = MediaTreeSelectorItem.create().setContent(
                    ContentSummaryAndCompareStatus.fromContentSummary(content)).setSelectable(false).build();

                if (!content) {
                   // item.setMissingItemId(missingItems.pop());
                }

                return item;
            });


            return items;
        }));
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
        return items.map(item => this.wrapItem(item));
    }

    private wrapItem(item: ContentTreeSelectorItem): MediaTreeSelectorItem {
        if (!item) {
            return null;
        }

        return MediaTreeSelectorItem.fromContentTreeSelectorItem(item);
    }

    static build(builder: ImageOptionDataLoaderBuilder): ImageOptionDataLoader {
        return new ImageOptionDataLoader(builder);
    }
}

export class ImageOptionDataLoaderBuilder extends ContentSummaryOptionDataLoaderBuilder {

    contentTypeNames: string[] = [ContentTypeName.IMAGE.toString(), ContentTypeName.MEDIA_VECTOR.toString()];

    build(): ImageOptionDataLoader {
        return new ImageOptionDataLoader(this);
    }
}
