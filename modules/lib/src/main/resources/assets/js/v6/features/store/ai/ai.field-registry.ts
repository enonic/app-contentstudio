import {FieldRegistry} from '@enonic/lib-admin-ui/form2';
import type {AiFieldPath} from './ai-protocol';

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

// InputField registers under `input.getPath().toString()` — an absolute dotted
// path relative to its form's root (e.g. `.foo.bar`). This resolves both the
// scope and the relative path in one step. Returns null for path kinds that
// don't map to a form field (page text components, topic).
export function resolveAiFieldTarget(path: AiFieldPath): AiFieldTarget | null {
    switch (path.kind) {
        case 'data':
            return {registry: getAiFieldRegistry('data'), fieldPath: `.${path.field}`};
        case 'mixin':
            return {registry: getAiFieldRegistry('mixin'), fieldPath: `.${path.field}`};
        case 'pageConfig':
        case 'componentConfig':
            // Plain component paths (`componentText`) update TextComponent values
            // and are handled by PageEventsManager + setAiValueAtPath instead.
            return {registry: getAiFieldRegistry('page'), fieldPath: `.${path.field}`};
        case 'topic':
        case 'componentText':
            return null;
    }
}
