import type {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {atom, computed} from 'nanostores';
import type {CompareStatus} from '../../../../app/content/CompareStatus';
import type {Content} from '../../../../app/content/Content';
import type {ContentData} from '../../../../app/ai/event/data/AiData';
import type {ContentType} from '../../../../app/inputtype/schema/ContentType';
import type {ContentWizardHeader} from '../../../../app/wizard/ContentWizardHeader';
import {$config} from '../config.store';
import {$languagesLoaded} from '../languages.store';
import type {EnonicAiPlugin} from './ai.types';

//
// * Facts
//

export const $aiContent = atom<Content | null>(null);

export const $aiContentType = atom<ContentType | null>(null);

export const $aiCurrentData = atom<ContentData | null>(null);

export const $aiDataTree = atom<PropertyTree | null>(null);

export const $aiContentHeader = atom<ContentWizardHeader | null>(null);

export const $aiCompareStatus = atom<CompareStatus | null>(null);

export const $aiInstructions = atom<Record<EnonicAiPlugin, string | undefined> | null>(null);

export const $aiContext = atom<string | undefined>(undefined);

export const $aiHasContentOperator = atom<boolean>(false);

export const $aiHasTranslator = atom<boolean>(false);

//
// * Derived
//

export const $aiReady = computed(
    [$config, $aiContent, $aiContentType, $aiInstructions, $languagesLoaded],
    (config, content, contentType, instructions, languagesLoaded): boolean => {
        return config.aiEnabled
            && content != null
            && contentType != null
            && instructions != null
            && languagesLoaded;
    },
);
