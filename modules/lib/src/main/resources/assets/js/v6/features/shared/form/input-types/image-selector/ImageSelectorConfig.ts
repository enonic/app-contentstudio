import {type GeneralSelectorConfig} from '../hooks';

export type ImageSelectorConfig = Omit<GeneralSelectorConfig, 'allowContentType'>;
