import type {AiFieldPath} from './ai-protocol';

//
// * AiFieldPath -> AiToolHelper path string
//
// `toAiToolHelperPath` encodes an `AiFieldPath` into the slash-prefixed string
// scheme that the lib-admin-ui `AiToolHelper` consumes for its animation and
// state UI. This is the only remaining boundary where the union must cross into
// the legacy string protocol; everything else routes on the union directly.

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
