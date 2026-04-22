import {render, screen} from '@testing-library/preact';
import {type ReactElement, type ReactNode, cloneElement, isValidElement} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {Action} from '@enonic/lib-admin-ui/ui/Action';

vi.mock('@enonic/ui', () => {
    type MockButtonProps = {
        label?: string;
        children?: ReactNode;
        disabled?: boolean;
        onClick?: () => void;
    } & Record<string, unknown>;

    const Button = ({
        label,
        children,
        disabled,
        onClick,
        ...props
    }: MockButtonProps) => (
        <button type='button' disabled={disabled} onClick={onClick} {...props}>
            {label ?? children}
        </button>
    );

    type MockIconButtonProps = {
        disabled?: boolean;
        onClick?: () => void;
        className?: string;
        icon?: unknown;
    } & Record<string, unknown>;

    const IconButton = ({
        disabled,
        onClick,
        className,
        icon: _icon,
        ...props
    }: MockIconButtonProps) => (
        <button
            type='button'
            disabled={disabled}
            onClick={onClick}
            className={className}
            hidden={className?.split(' ').includes('hidden')}
            {...props}
        />
    );

    const ToolbarItem = ({
        children,
        disabled = false,
    }: {
        children: ReactElement;
        disabled?: boolean;
    }) => {
        if (!isValidElement(children)) {
            return <>{children}</>;
        }

        const child = children as ReactElement<{disabled?: boolean}>;

        return cloneElement(child, {
            disabled: disabled || Boolean(child.props.disabled),
        });
    };

    const MenuRoot = ({children}: {children?: ReactNode}) => <div>{children}</div>;

    type MockMenuTriggerProps = {
        children: ReactElement;
    } & Record<string, unknown>;

    const MenuTrigger = ({
        children,
        ...props
    }: MockMenuTriggerProps) => {
        if (!isValidElement(children)) {
            return <>{children}</>;
        }

        return cloneElement(children, props);
    };
    const MenuPortal = ({children}: {children?: ReactNode}) => <>{children}</>;
    const MenuContent = ({children}: {children?: ReactNode}) => <div role='menu'>{children}</div>;
    const MenuItem = ({
        children,
        disabled = false,
        onSelect,
    }: {
        children?: ReactNode;
        disabled?: boolean;
        onSelect?: () => void;
    }) => (
        <button type='button' role='menuitem' disabled={disabled} onClick={onSelect}>
            {children}
        </button>
    );

    return {
        Button,
        IconButton,
        Menu: Object.assign(MenuRoot, {
            Trigger: MenuTrigger,
            Portal: MenuPortal,
            Content: MenuContent,
            Item: MenuItem,
        }),
        Toolbar: {
            Item: ToolbarItem,
        },
        Tooltip: ({children}: {children?: ReactNode}) => <>{children}</>,
        cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
    };
});

vi.mock('../../../hooks/useI18n', () => ({
    useI18n: (key: string) => key,
}));

vi.mock('lucide-react', () => ({
    ChevronDown: () => null,
}));

import {SplitActionButton} from './SplitActionButton';

const createAction = ({
    label,
    enabled = true,
    visible = true,
}: {
    label: string;
    enabled?: boolean;
    visible?: boolean;
}) => {
    const action = new Action(label);
    action.setEnabled(enabled);
    action.setVisible(visible);

    return action;
};

describe('SplitActionButton', () => {
    it('filters out invisible actions before choosing the primary action and menu items', () => {
        render(
            <SplitActionButton
                actions={[
                    {action: createAction({label: 'Hidden', visible: false})},
                    {action: createAction({label: 'Visible'})},
                ]}
            />
        );

        expect(screen.getByRole('button', {name: 'Visible'})).toBeDefined();
        expect(screen.queryByText('Hidden')).toBeNull();
        expect(screen.queryByRole('button', {name: 'tooltip.moreActions'})).toBeNull();
    });

    it('disables the dropdown trigger when every overflow menu action is disabled', () => {
        render(
            <SplitActionButton
                actions={[
                    {action: createAction({label: 'Primary'})},
                    {action: createAction({label: 'Disabled A', enabled: false})},
                    {action: createAction({label: 'Disabled B', enabled: false})},
                ]}
            />
        );

        const dropdownButton = screen.getByRole<HTMLButtonElement>('button', {name: 'tooltip.moreActions'});

        expect(dropdownButton.disabled).toBe(true);
    });

    it('keeps disabled overflow actions in the menu while promoting the first enabled action to primary', () => {
        render(
            <SplitActionButton
                actions={[
                    {action: createAction({label: 'Disabled First', enabled: false})},
                    {action: createAction({label: 'Enabled Primary'})},
                    {action: createAction({label: 'Disabled Last', enabled: false})},
                ]}
            />
        );

        expect(screen.getByRole('button', {name: 'Enabled Primary'})).toBeDefined();

        const menuItems = screen.getAllByRole<HTMLButtonElement>('menuitem');
        const disabledLabels = menuItems
            .filter((item) => item.disabled)
            .map((item) => item.textContent?.trim());

        expect(disabledLabels).toEqual(['Disabled First', 'Disabled Last']);
    });

    it('keeps the first visible action as primary when configured for overflow ordering', () => {
        render(
            <SplitActionButton
                actions={[
                    {action: createAction({label: 'Disabled First', enabled: false})},
                    {action: createAction({label: 'Enabled Second'})},
                    {action: createAction({label: 'Enabled Third'})},
                ]}
                primaryActionStrategy='firstVisible'
            />
        );

        const primaryButton = screen.getByRole<HTMLButtonElement>('button', {name: 'Disabled First'});
        const menuItemLabels = screen
            .getAllByRole<HTMLButtonElement>('menuitem')
            .map((item) => item.textContent?.trim());

        expect(primaryButton.disabled).toBe(true);
        expect(menuItemLabels).toEqual(['Enabled Second', 'Enabled Third']);
    });

    it('keeps the dropdown trigger enabled for disabled overflow actions when configured', () => {
        render(
            <SplitActionButton
                actions={[
                    {action: createAction({label: 'Disabled First', enabled: false})},
                    {action: createAction({label: 'Disabled Second', enabled: false})},
                    {action: createAction({label: 'Disabled Third', enabled: false})},
                ]}
                primaryActionStrategy='firstVisible'
                disableMenuWhenAllMenuActionsDisabled={false}
            />
        );

        const dropdownButton = screen.getByRole<HTMLButtonElement>('button', {name: 'tooltip.moreActions'});
        const menuItems = screen.getAllByRole<HTMLButtonElement>('menuitem');

        expect(dropdownButton.disabled).toBe(false);
        expect(menuItems.every((item) => item.disabled)).toBe(true);
    });
});
