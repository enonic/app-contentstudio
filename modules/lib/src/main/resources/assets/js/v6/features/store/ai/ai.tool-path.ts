import type {AiFieldPath} from './ai-protocol';
import {AI_TOPIC_PATH} from './ai.types';

//
// * AiFieldPath -> stable path-key string
//
// `toAiToolHelperPath` encodes an `AiFieldPath` into a deterministic
// slash-prefixed string. `ai.router.ts` keys processing tokens by it, so the
// same path maps to the same key across a field's processing/completed events.

const DATA = '__data__';
const MIXINS = '__mixins__';
const PAGE = '__page__';
const CONFIG = '__config__';
const TOPIC = '__topic__';

// Dotted field path -> slash-separated tail.
function fieldToTail(field: string): string {
    return field.replace(/\./g, '/');
}

export function toAiToolHelperPath(path: AiFieldPath): string {
    switch (path.kind) {
        case 'topic':
            return `${DATA}/${TOPIC}`;
        case 'data':
            return `${DATA}/${fieldToTail(path.field)}`;
        case 'mixin': {
            const [appName, mixinName] = path.mixin.split(':');
            const tail = path.field ? `/${fieldToTail(path.field)}` : '';
            return `${MIXINS}/${appName}/${mixinName}${tail}`;
        }
        case 'pageConfig':
            return `${PAGE}/${CONFIG}/${fieldToTail(path.field)}`;
        case 'componentText':
            return `${PAGE}${path.component}`;
        case 'componentConfig':
            return `${PAGE}${path.component}/${CONFIG}/${fieldToTail(path.field)}`;
    }
}

// `toPluginContextPath` encodes an `AiFieldPath` in the format the AI Content
// Operator plugin uses for `context:set` / its internal `$context` store:
// a leading-slash, slash-separated content-data path. Returns null for kinds
// the plugin cannot resolve against its form model (mixins/x-data, page config,
// page text components) — those would be rejected by the plugin's own
// `isValidContext` check and reset to undefined.
export function toPluginContextPath(path: AiFieldPath): string | null {
    switch (path.kind) {
        case 'topic':
            return AI_TOPIC_PATH;
        case 'data':
            return `/${fieldToTail(path.field)}`;
        case 'mixin':
        case 'pageConfig':
        case 'componentText':
        case 'componentConfig':
            return null;
    }
}
