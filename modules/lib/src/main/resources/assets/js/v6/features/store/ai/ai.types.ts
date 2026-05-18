import type {EnonicAiContentOperatorSetupData} from '../../../../app/ai/event/data/EnonicAiContentOperatorSetupData';
import type {EnonicAiTranslatorSetupData} from '../../../../app/ai/event/data/EnonicAiTranslatorSetupData';

export type EnonicAi = {
    contentOperator?: {
        setup(setupData: EnonicAiContentOperatorSetupData): void;
        render(buttonContainer: HTMLElement, dialogContainer: HTMLElement): void;
    };
    translator?: {
        setup(setupData: EnonicAiTranslatorSetupData): void;
        render(container: HTMLElement): void;
    };
};

export type EnonicAiPlugin = keyof EnonicAi;

declare global {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Window {
        Enonic?: {
            AI?: EnonicAi;
        };
    }
}

export const AI_PLUGIN_KEYS: Readonly<Record<EnonicAiPlugin, `com.enonic.app.ai.${string}`>> = {
    contentOperator: 'com.enonic.app.ai.contentoperator',
    translator: 'com.enonic.app.ai.translator',
};

// AI path scheme — a string protocol shared with the AI translator/operator
// plugins. A field is addressed by a prefix plus a slash-separated path. Quirks
// worth knowing before touching path code:
//
//   - This scheme is parsed and built independently in `ai.bridge.ts`,
//     `ai.field-registry.ts`, and `ai.commands.ts`. Keep the three in sync.
//   - `ComponentPath.toString()` already starts with `/` (e.g. `/main/2`), so
//     page paths are `AI_PAGE_PREFIX` + path — never with a `/` in between.
//   - The translator round-trips the topic as `__data__/__topic__`, not
//     `/__topic__`; `isTopicPath` matches it by substring, not by equality.

export const AI_DATA_PREFIX = '__data__';

export const AI_MIXINS_PREFIX = '__mixins__';

export const AI_PAGE_PREFIX = '__page__';

export const AI_CONFIG_PREFIX = '__config__';

export const AI_TOPIC = '__topic__';

export const AI_TOPIC_PATH = `/${AI_TOPIC}`;
