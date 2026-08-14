import type { PropertySet } from '@enonic/lib-admin-ui/data/PropertySet';
import { PropertyTree } from '@enonic/lib-admin-ui/data/PropertyTree';
import type { FormItem } from '@enonic/lib-admin-ui/form/FormItem';
import type { FormOptionSet } from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import { fireEvent, render, screen } from '@testing-library/preact';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@enonic/ui', () => {
    type MockProps = { children?: ReactNode } & Record<string, unknown>;

    // Forwards rest props (including onKeyDown) like the real RadioGroup.Root,
    // where a passed onKeyDown replaces the built-in roving arrow navigation.
    const Root = ({ children, name: _name, value: _value, onValueChange: _onValueChange, ...props }: MockProps) => (
        <div role="radiogroup" {...props}>
            {children}
        </div>
    );
    Root.displayName = 'RadioGroup.Root';

    const Item = ({ children, value: _value, disabled: _disabled, ...props }: MockProps) => (
        <button type="button" role="radio" {...props}>
            {children}
        </button>
    );
    Item.displayName = 'RadioGroup.Item';

    const Indicator = (): null => null;
    Indicator.displayName = 'RadioGroup.Indicator';

    return { RadioGroup: { Root, Item, Indicator } };
});

vi.mock('../../../FormItemRenderer', () => ({
    FormItemRenderer: () => <input data-testid="nested-input" />,
}));

import { LockedSingleRadioBody } from './LockedSingleRadioBody';

const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

const createFormItem = (name: string): FormItem => ({ getName: () => name }) as unknown as FormItem;

const createOption = (name: string, formItems: FormItem[]): unknown => ({
    getName: () => name,
    getLabel: () => name,
    getFormItems: () => formItems,
});

const createOptionSet = (): FormOptionSet =>
    ({
        getName: () => 'myOptionSet',
        getOptions: () => [createOption('opt1', [createFormItem('text')]), createOption('opt2', [])],
    }) as unknown as FormOptionSet;

const createOccurrence = (): PropertySet => {
    const tree = new PropertyTree();
    const occurrence = tree.getRoot();
    occurrence.addPropertySet('opt1');
    return occurrence;
};

const renderBody = (): void => {
    render(
        <LockedSingleRadioBody
            enabled
            optionSet={createOptionSet()}
            occurrencePropertySet={createOccurrence()}
            selectedNames={['opt1']}
            onSelect={vi.fn()}
        />,
    );
};

describe('LockedSingleRadioBody', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each(ARROW_KEYS)('should keep %s native in inputs nested under the checked option', (key) => {
        renderBody();

        const notPrevented = fireEvent.keyDown(screen.getByTestId('nested-input'), { key });

        expect(notPrevented).toBe(true);
    });

    it.each(ARROW_KEYS)('should prevent %s on the radio items to keep them inert', (key) => {
        renderBody();

        const [checkedRadio] = screen.getAllByRole('radio');
        const notPrevented = fireEvent.keyDown(checkedRadio, { key });

        expect(notPrevented).toBe(false);
    });

    it('should not prevent non-arrow keys on the radio items', () => {
        renderBody();

        const [checkedRadio] = screen.getAllByRole('radio');
        const notPrevented = fireEvent.keyDown(checkedRadio, { key: 'Tab' });

        expect(notPrevented).toBe(true);
    });
});
