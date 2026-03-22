import {type GeneralSelectorConfig} from '../../../../hooks/useSelectorInput';

export type ImageSelectorConfig = Omit<GeneralSelectorConfig, 'allowContentType'>;
