import type {EnonicAiContentOperatorSetupData} from '../../../../app/ai/event/data/EnonicAiContentOperatorSetupData';

// Transition type: the shape the legacy AI Content Operator attaches to
// `window.Enonic.AI` during the dual-run. The new protocol's `AiHost` owns the
// global declaration (see ai-protocol.ts); legacy call sites read this slot via
// an explicit cast. Removed once the operator is migrated.
export type LegacyEnonicAi = {
    contentOperator?: {
        setup(setupData: EnonicAiContentOperatorSetupData): void;
        render(buttonContainer: HTMLElement, dialogContainer: HTMLElement): void;
    };
};

// Both AI plugins still receive per-plugin instructions through `$aiInstructions`:
// the operator via the legacy `AiContentOperatorConfigureEvent`, the translator
// via the new protocol's `config:change` signal (see ai.snapshots.ts). The key
// set therefore stays wider than `keyof LegacyEnonicAi`.
export type EnonicAiPlugin = 'contentOperator' | 'translator';

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
