import {ContentTreeSelectorItem, ContentTreeSelectorItemJson} from '../item/ContentTreeSelectorItem';
import {ResultMetadataJson} from './json/ResultMetadataJson';
import {ResultMetadata} from './ResultMetadata';

export interface ContentTreeSelectorListJson {

    items: ContentTreeSelectorItemJson[];

    metadata: ResultMetadataJson;
}

export class ContentTreeSelectorListResult<DATA extends ContentTreeSelectorItem> {
    items: DATA[] = [];

    metadata: ResultMetadata;

    constructor(items: DATA[], metadata: ResultMetadata) {
        this.items = items;
        this.metadata = metadata;
    }

    setItems(value: DATA[]): ContentTreeSelectorListResult<DATA> {
        this.items = value;
        return this;
    }

    setMetadata(value: ResultMetadata): ContentTreeSelectorListResult<DATA> {
        this.metadata = value;
        return this;
    }
}
