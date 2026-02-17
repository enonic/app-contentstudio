import {type ContentTreeSelectorItemJson} from '../../item/ContentTreeSelectorItem';
import {type ResultMetadataJson} from './ResultMetadataJson';

export interface ContentTreeSelectorListJson {

    items: ContentTreeSelectorItemJson[];

    metadata: ResultMetadataJson;
}
