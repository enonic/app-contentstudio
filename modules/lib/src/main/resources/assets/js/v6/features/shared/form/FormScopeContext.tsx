import type { Input } from '@enonic/input-types/schema';
import { useStore } from '@nanostores/preact';
import { createContext, type ReactElement, type ReactNode, useContext, useEffect, useMemo } from 'react';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { Project } from '../../../../app/settings/data/project/Project';
import { $contextContent } from '../../../entities/content';
import { $activeProject } from '../../../entities/project';

/**
 * The project and the content a form's inputs work against. A key that is absent
 * falls back to the active project or the context content; `null` means none.
 */
export type FormScope = {
    project?: Readonly<Project> | null;
    content?: ContentSummary | null;
};

export type ResolvedFormScope = {
    project: Readonly<Project> | undefined;
    content: ContentSummary | undefined;
};

export type FormScopeRequirement = {
    project?: boolean;
    content?: boolean;
};

export type FormScopeRequirementResult = {
    enabled: boolean;
    missing: (keyof ResolvedFormScope)[];
};

// ? Defaults to an empty scope rather than `undefined`, unlike the other contexts: the hooks must
// ? work without a provider (content wizard, dialogs) by falling back to the stores, not throw.
const FormScopeContext = createContext<FormScope>({});

//
// * FormScopeProvider
//

type FormScopeProviderProps = FormScope & {
    children: ReactNode;
};

// Merges with the scope above it: only the props that were given override the parent's keys.
export const FormScopeProvider = ({ project, content, children }: FormScopeProviderProps): ReactElement => {
    const parent = useContext(FormScopeContext);

    const value = useMemo(() => {
        const scope: FormScope = { ...parent };
        if (project !== undefined) scope.project = project;
        if (content !== undefined) scope.content = content;
        return scope;
    }, [parent, project, content]);

    return <FormScopeContext.Provider value={value}>{children}</FormScopeContext.Provider>;
};

FormScopeProvider.displayName = 'FormScopeProvider';

//
// * Hooks
//

/**
 * The project and the content the enclosing form works against. Use instead of
 * `useStore($activeProject)` / `useStore($contextContent)` inside a `FormRenderer`.
 * Both come back as `undefined` when there is none.
 */
export const useFormScope = (): ResolvedFormScope => {
    const scope = useContext(FormScopeContext);
    const activeProject = useStore($activeProject);
    const contextContent = useStore($contextContent);

    const project = 'project' in scope ? scope.project : activeProject;
    const content = 'content' in scope ? scope.content : contextContent;

    return { project: project ?? undefined, content: content ?? undefined };
};

/**
 * Whether the scope has what an input cannot work without, warning once per mount
 * with the input's type and name when it does not. AND `enabled` into the input's own.
 * Pass only the keys the input strictly needs; a feature that merely degrades without
 * one (upload, add-new, suggestions) reads `useFormScope()` and hides itself instead.
 *
 * `const { enabled } = useFormScopeRequirement(props.input, { project: true });`
 */
export const useFormScopeRequirement = (
    input: Input,
    requirement: FormScopeRequirement,
): FormScopeRequirementResult => {
    const { project, content } = useFormScope();

    const missing = useMemo(() => {
        const keys: (keyof ResolvedFormScope)[] = [];
        if (requirement.project && project == null) keys.push('project');
        if (requirement.content && content == null) keys.push('content');
        return keys;
    }, [requirement.project, requirement.content, project, content]);

    const missingKey = missing.join(',');

    useEffect(() => {
        if (missingKey.length === 0) return;
        const name = `${input.getInputType().toString()} '${input.getName()}'`;
        console.warn(`${name} is disabled: the form scope has no ${missingKey.split(',').join(' and no ')}.`);
    }, [input, missingKey]);

    return { enabled: missing.length === 0, missing };
};
