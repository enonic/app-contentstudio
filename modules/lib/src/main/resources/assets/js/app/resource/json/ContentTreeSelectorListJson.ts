import {ContentTreeSelectorItemJson} from '../../item/ContentTreeSelectorItem';
import {ResultMetadataJson} from './ResultMetadataJson';

export interface ContentTreeSelectorListJson {

    items: ContentTreeSelectorItemJson[];

    metadata: ResultMetadataJson;
}
