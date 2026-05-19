// Both AI plugins receive per-plugin instructions through `$aiInstructions`; the
// host fans them out to each plugin via the protocol's `config:change` signal
// (see ai.snapshots.ts).
export type EnonicAiPlugin = 'contentOperator' | 'translator';

export const AI_PLUGIN_KEYS: Readonly<Record<EnonicAiPlugin, `com.enonic.app.ai.${string}`>> = {
    contentOperator: 'com.enonic.app.ai.contentoperator',
    translator: 'com.enonic.app.ai.translator',
};

// Field-path routing is union-native (see `ai.bridge.ts`, `ai.field-registry.ts`,
// `ai.router.ts`, which switch on `AiFieldPath.kind`). `AI_TOPIC`/`AI_TOPIC_PATH`
// address the display-name field.

export const AI_TOPIC = '__topic__';

export const AI_TOPIC_PATH = `/${AI_TOPIC}`;
