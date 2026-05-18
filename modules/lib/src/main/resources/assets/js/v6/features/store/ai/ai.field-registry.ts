import {FieldRegistry} from '@enonic/lib-admin-ui/form2';
import {AI_CONFIG_PREFIX, AI_DATA_PREFIX, AI_MIXINS_PREFIX, AI_PAGE_PREFIX} from './ai.types';

//
// * Scope-keyed registries
//

// A single shared registry would collide when fields with the same property path
// exist in two simultaneously-mounted FormRenderers (e.g. ContentForm and the
// page-editor inspect panel both defining `.title`). Splitting by AI path prefix
// matches the natural mount boundaries and keeps lookups unambiguous:
//
//   - 'data'  — ContentForm (main wizard form)
//   - 'mixin' — MixinView (only one mixin tab is mounted at a time)
//   - 'page'  — Page/Component inspect panel (mutually exclusive)
export type AiFieldRegistryScope = 'data' | 'mixin' | 'page';

const registries = new Map<AiFieldRegistryScope, FieldRegistry>();

export function getAiFieldRegistry(scope: AiFieldRegistryScope): FieldRegistry {
    let registry = registries.get(scope);
    if (registry == null) {
        registry = new FieldRegistry();
        registries.set(scope, registry);
    }
    return registry;
}

//
// * Path resolution — AI event path → (registry, InputField path)
//

export type AiFieldTarget = {
    registry: FieldRegistry;
    fieldPath: string;
};

// AI translator/operator event paths come prefix-tagged (e.g. `__data__/foo/bar`).
// InputField registers under `input.getPath().toString()` — an absolute dotted path
// relative to its form's root (e.g. `.foo.bar`). This resolves both the scope and
// the relative path in one step. Returns null for paths that don't map to a form
// field (page text components, topic, etc.).
export function resolveAiFieldTarget(aiPath: string): AiFieldTarget | null {
    if (aiPath.startsWith(AI_DATA_PREFIX)) {
        const fieldPath = slashesToDotsAbsolute(aiPath.slice(AI_DATA_PREFIX.length));
        return {registry: getAiFieldRegistry('data'), fieldPath};
    }

    if (aiPath.startsWith(AI_MIXINS_PREFIX)) {
        // `__mixins__/<appName>/<mixinName>/<relative>` → '.<relative>'
        const tail = aiPath.split('/').slice(3).join('/');
        return {registry: getAiFieldRegistry('mixin'), fieldPath: slashesToDotsAbsolute(tail)};
    }

    if (aiPath.startsWith(AI_PAGE_PREFIX)) {
        // Only `__config__`-suffixed page paths target a form field. Plain component
        // paths (`__page__/<componentPath>`) update TextComponent values and are
        // handled by PageEventsManager + setAiValueAtPath.
        const configMarker = `/${AI_CONFIG_PREFIX}`;
        const configIdx = aiPath.indexOf(configMarker);
        if (configIdx < 0) return null;
        const tail = aiPath.slice(configIdx + configMarker.length);
        return {registry: getAiFieldRegistry('page'), fieldPath: slashesToDotsAbsolute(tail)};
    }

    return null;
}

function slashesToDotsAbsolute(tail: string): string {
    const trimmed = tail.startsWith('/') ? tail.slice(1) : tail;
    return `.${trimmed.replace(/\//g, '.')}`;
}
