import type {AiFieldPath} from './ai-protocol';

//
// * Legacy AI path scheme <-> AiFieldPath
//
// The legacy scheme is a string protocol with five prefixes. `parseLegacy`
// decodes it; `formatToLegacy` encodes the union back. Both are pure. Used by
// the union router so legacy traffic and new-protocol traffic share one router.

const DATA = '__data__';
const MIXINS = '__mixins__';
const PAGE = '__page__';
const CONFIG = '__config__';
const TOPIC = '__topic__';

// Slash-separated path tail -> dotted field path, no leading dot or slash.
function tailToField(tail: string): string {
    const trimmed = tail.startsWith('/') ? tail.slice(1) : tail;
    return trimmed.replace(/\//g, '.');
}

export function parseLegacy(legacyPath: string): AiFieldPath | null {
    if (legacyPath.indexOf(TOPIC) > -1) {
        return {kind: 'topic'};
    }

    if (legacyPath.startsWith(MIXINS)) {
        const parts = legacyPath.split('/');
        const appName = parts[1];
        const mixinName = parts[2];
        if (!appName || !mixinName) {
            return null;
        }
        const mixin = `${appName.replace(/[/-]/g, '.')}:${mixinName}`;
        return {kind: 'mixin', mixin, field: parts.slice(3).join('.')};
    }

    if (legacyPath.startsWith(PAGE)) {
        const rest = legacyPath.slice(PAGE.length);
        const marker = `/${CONFIG}`;
        const configIdx = rest.indexOf(marker);
        if (configIdx < 0) {
            return {kind: 'componentText', component: rest};
        }
        const component = rest.slice(0, configIdx);
        const field = tailToField(rest.slice(configIdx + marker.length));
        return component === ''
            ? {kind: 'pageConfig', field}
            : {kind: 'componentConfig', component, field};
    }

    if (legacyPath.startsWith(DATA)) {
        return {kind: 'data', field: tailToField(legacyPath.slice(DATA.length))};
    }

    return null;
}

// Dotted field path -> slash-separated tail.
function fieldToTail(field: string): string {
    return field.replace(/\./g, '/');
}

export function formatToLegacy(path: AiFieldPath): string {
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
