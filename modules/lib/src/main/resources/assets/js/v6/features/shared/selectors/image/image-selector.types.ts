import {type ContentSelectorFilterOptions, type ContentSelectorMode} from '../content';

export type ImageSelectorFilterOptions = Omit<ContentSelectorFilterOptions, 'contentTypeNames'>;
export type ImageSelectorMode = ContentSelectorMode;
