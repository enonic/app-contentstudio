import { type Form, type FormItem, Input } from '@enonic/input-types/schema';
import type { FormScope, FormScopeRequirement } from './FormScopeContext';

// What each input type cannot work without; mirrors its `useFormScopeRequirement` call.
// ? ContentTypeFilter needs the content only in its content-bound mode; counted as project-only.
const SCOPE_REQUIREMENTS: Record<string, FormScopeRequirement> = {
    AttachmentUploader: { project: true, content: true },
    ContentSelector: { project: true },
    ContentTypeFilter: { project: true },
    CustomSelector: { project: true, content: true },
    ImageSelector: { project: true },
    ImageUploader: { project: true, content: true },
    MediaSelector: { project: true },
    MediaUploader: { project: true, content: true },
    SiteConfigurator: { content: true },
};

/**
 * Whether the form has an input the scope disables: one that needs a project or a
 * content item the scope sets to `null`. A key left out falls back to the stores and
 * counts as present. Nested item sets and option sets are searched too.
 */
export const hasScopeDisabledInputs = (form: Form, scope: FormScope): boolean => {
    const missing: FormScopeRequirement = { project: scope.project === null, content: scope.content === null };
    if (!missing.project && !missing.content) return false;

    return hasDisabledInput(form.getFormItems(), missing);
};

// Internal. Walks the items recursively; `missing` flags what the scope lacks.
const hasDisabledInput = (items: readonly FormItem[], missing: FormScopeRequirement): boolean =>
    items.some((item) => {
        if (!(item instanceof Input)) return hasDisabledInput(item.getFormItems(), missing);

        const requirement = SCOPE_REQUIREMENTS[item.getInputType().toString()];
        return Boolean((requirement?.project && missing.project) || (requirement?.content && missing.content));
    });
