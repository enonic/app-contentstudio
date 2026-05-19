// Both AI plugins receive per-plugin instructions through `$aiInstructions`; the
// host fans them out to each plugin via the protocol's `config:change` signal
// (see ai.snapshots.ts).
export type EnonicAiPlugin = 'contentOperator' | 'translator';

export const AI_PLUGIN_KEYS: Readonly<Record<EnonicAiPlugin, `com.enonic.app.ai.${string}`>> = {
    contentOperator: 'com.enonic.app.ai.contentoperator',
    translator: 'com.enonic.app.ai.translator',
};

// AI path scheme — the legacy string protocol. Field-path routing is now
// union-native (see `ai.bridge.ts`, `ai.field-registry.ts`, `ai.router.ts`,
// which switch on `AiFieldPath.kind`). The only place that still builds this
// string scheme is `ai.tool-path.ts`, which encodes an `AiFieldPath` for the
// lib-admin-ui `AiToolHelper`. The prefixes below survive for the legacy
// `ContentWizardHeader` group tags and the topic path.
//
//   - `ComponentPath.toString()` already starts with `/` (e.g. `/main/2`), so
//     page paths are `AI_PAGE_PREFIX` + path — never with a `/` in between.

export const AI_DATA_PREFIX = '__data__';

export const AI_MIXINS_PREFIX = '__mixins__';

export const AI_PAGE_PREFIX = '__page__';

export const AI_CONFIG_PREFIX = '__config__';

export const AI_TOPIC = '__topic__';

export const AI_TOPIC_PATH = `/${AI_TOPIC}`;
