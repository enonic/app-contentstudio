import { type ContentTreeSelectorItemJson } from '../../item/ContentTreeSelectorItem';
import { type ResultMetadataJson } from '../../../v6/shared/api/ResultMetadataJson';

export interface ContentTreeSelectorListJson {
    items: ContentTreeSelectorItemJson[];

    metadata: ResultMetadataJson;
}
