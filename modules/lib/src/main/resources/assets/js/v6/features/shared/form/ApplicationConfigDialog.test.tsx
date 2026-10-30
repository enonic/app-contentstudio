import { Form, Input } from '@enonic/input-types/schema';
import { registerBuiltInTypes } from '@enonic/input-types';
import { PropertyTree } from '@enonic/input-types/data';
import { cleanup, render, screen } from '@testing-library/preact';
import type { ReactNode } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const { formRendererProps } = vi.hoisted(() => ({ formRendererProps: { current: undefined as unknown } }));

vi.mock('@enonic/ui', () => {
    const passthrough = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
    return {
        cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
        Button: ({ label }: { label?: string }) => <button type="button">{label}</button>,
        Dialog: {
            Root: passthrough,
            Portal: passthrough,
            Overlay: () => null,
            Content: passthrough,
            Header: passthrough,
            Title: passthrough,
            Description: passthrough,
            DefaultClose: () => null,
            Body: passthrough,
            Footer: passthrough,
            Close: passthrough,
        },
    };
});

vi.mock('../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string) => key,
}));

vi.mock('../../../shared/ui/dialogs/ConfirmationDialog', () => ({
    ConfirmationDialog: { Content: () => null, DefaultHeader: () => null, Footer: () => null },
}));

vi.mock('./FormRenderer', () => ({
    FormRenderer: (props: unknown) => {
        formRendererProps.current = props;
        return <div data-testid="form-renderer" />;
    },
}));

import type { Project } from '../../../../app/settings/data/project/Project';
import { ApplicationConfigDialog } from './ApplicationConfigDialog';

const createForm = (inputType: string): Form =>
    new Form([
        Input.fromJson({
            formItemType: 'Input',
            name: 'title',
            inputType,
            label: 'Title',
            occurrences: { minimum: 0, maximum: 1 },
            config: {},
            helpText: '',
        } as Parameters<typeof Input.fromJson>[0]),
    ]);

const form = createForm('TextLine');
const contentSelectorForm = createForm('ContentSelector');

const WARNING_KEY = 'dialog.applicationConfig.disabledInputs';

const project = { getName: () => 'layer' } as unknown as Project;

type Scope = { project?: Readonly<Project> | null; content?: null };

const renderDialog = (props: Scope & { form?: Form } = {}) =>
    render(
        <ApplicationConfigDialog
            application={undefined}
            applicationKey="app:test"
            form={form}
            configSet={new PropertyTree().getRoot()}
            enabled
            onApply={vi.fn()}
            onClose={vi.fn()}
            {...props}
        />,
    );

const getFormScope = (): Scope => {
    const { project, content } = formRendererProps.current as Scope;
    return { project, content };
};

describe('ApplicationConfigDialog', () => {
    beforeAll(() => {
        registerBuiltInTypes();
    });

    afterEach(() => {
        cleanup();
        formRendererProps.current = undefined;
        vi.restoreAllMocks();
    });

    it('should pass an empty scope to the form as given', () => {
        renderDialog({ project: null, content: null });

        expect(getFormScope()).toEqual({ project: null, content: null });
    });

    it('should pass the project to the form with no content', () => {
        renderDialog({ project, content: null });

        expect(getFormScope().project).toBe(project);
        expect(getFormScope().content).toBeNull();
    });

    it('should leave the scope to the form when none is given', () => {
        renderDialog();

        expect(getFormScope()).toEqual({ project: undefined, content: undefined });
    });

    it('should warn above the form when the scope disables one of its inputs', () => {
        renderDialog({ form: contentSelectorForm, project: null, content: null });

        expect(screen.getByText(WARNING_KEY)).toBeTruthy();
    });

    it('should not warn when no input depends on what the scope lacks', () => {
        renderDialog({ project: null, content: null });

        expect(screen.queryByText(WARNING_KEY)).toBeNull();
    });

    it('should not warn when the scope is left to the stores', () => {
        renderDialog({ form: contentSelectorForm });

        expect(screen.queryByText(WARNING_KEY)).toBeNull();
    });
});
