import type {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {atom, computed, map} from 'nanostores';
import type {CompareStatus} from '../../../../app/content/CompareStatus';
import type {Content} from '../../../../app/content/Content';
import type {ContentData} from '../../../../app/ai/event/data/AiData';
import type {Mixin} from '../../../../app/content/Mixin';
import type {MixinDescriptor} from '../../../../app/content/MixinDescriptor';
import type {ContentType} from '../../../../app/inputtype/schema/ContentType';
import type {Descriptor} from '../../../../app/page/Descriptor';
import type {Page} from '../../../../app/page/Page';
import type {ContentWizardHeader} from '../../../../app/wizard/ContentWizardHeader';
import {$config} from '../config.store';
import {$languagesLoaded} from '../languages.store';
import type {AiPluginId} from './ai-protocol';
import type {EnonicAiPlugin} from './ai.types';

// Writer bridge supplied by `wizardContent.store` at module init. Inverts the
// dependency so ai.bridge can apply AI updates to the v6 wizard state without
// importing `wizardContent.store` directly (which would create a module cycle).
export type AiWizardBridge = {
    applyDisplayName: (text: string) => void;
    getCurrentDisplayName: () => string;
    findMixinByKey: (key: string) => Mixin | undefined;
    getCurrentMixins: () => Mixin[];
    getCurrentMixinDescriptors: () => MixinDescriptor[];
    getCurrentPage: () => Page | null;
    getCurrentPageDescriptor: () => Descriptor | null;
    getCurrentComponentDescriptors: () => Descriptor[];
};

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

// Tracks each plugin's dialog visibility, reported by plugins via
// `api.setDialogState`. Lets CS toolbar controls reflect dialog open state.
export const $aiPluginDialogOpen = map<Record<AiPluginId, boolean>>({
    'ai.translator': false,
    'ai.contentOperator': false,
});

// Display-name field is not registered in any FieldRegistry, so processing state for
// the `__topic__` path is exposed here for DisplayNameInput to subscribe to directly.
// Same reason for the error atom — translator failures on `__topic__` can't go
// through `FieldRegistry.setTransientError` since there's no handle to route to.
export const $aiTopicProcessing = atom<boolean>(false);

export const $aiTopicError = atom<string | null>(null);

export const $aiWizardBridge = atom<AiWizardBridge | null>(null);

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
