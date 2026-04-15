import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {Button, cn, IconButton, Menu, Toolbar, Tooltip} from '@enonic/ui';
import {ChevronDown} from 'lucide-react';
import {type ReactElement, useEffect, useMemo, useState} from 'react';
import {useI18n} from '../../../hooks/useI18n';

export type SplitActionButtonAction = {
    action: Action;
};

type Props = {
    actions: SplitActionButtonAction[];
    className?: string;
    triggerClassName?: string;
    disabled?: boolean;
};

type ActionState = {
    action: Action;
    label: string;
    enabled: boolean;
};

const getActionState = (action: Action): ActionState => ({
    action,
    label: action.getLabel(),
    enabled: action.isEnabled(),
});

// TODO: Enonic UI - Move to @enonic/ui
/**
 * A split button component with a primary action button and a dropdown menu.
 *
 * - The main button executes the first enabled action immediately when clicked
 * - The dropdown chevron button opens a menu with all other actions
 * - The buttons are visually joined together as a single unit
 */
export const SplitActionButton = ({actions, className, triggerClassName, disabled = false}: Props): ReactElement | null => {
    const moreLabel = useI18n('tooltip.moreActions');
    const [renderVersion, setRenderVersion] = useState(0);

    useEffect(() => {
        const listener = () => setRenderVersion((value: number) => value + 1);
        const subscriptions = actions.map(({action}) => {
            action.onPropertyChanged(listener);
            return {action, listener};
        });

        // Re-read action states to catch changes that occurred before listeners were registered
        listener();

        return () => {
            subscriptions.forEach(({action, listener}) => action.unPropertyChanged(listener));
        };
    }, [actions]);

    const actionStates = useMemo(
        () => actions.map(({action}) => getActionState(action)),
        [actions, renderVersion]
    );

    // Determine primary action index (first enabled action)
    const primaryIndex = useMemo(() => {
        const firstEnabledIndex = actionStates.findIndex((state) => state.enabled);
        return firstEnabledIndex !== -1 ? firstEnabledIndex : 0;
    }, [actionStates]);

    const primaryState = actionStates[primaryIndex];
    const menuStates = useMemo(
        () => [...actionStates.slice(0, primaryIndex), ...actionStates.slice(primaryIndex + 1)],
        [actionStates, primaryIndex]
    );

    const hasMenuActions = menuStates.length > 0;

    if (!primaryState || actions.length === 0) {
        return null;
    }

    const isPrimaryDisabled = disabled || !primaryState.enabled;
    const isDropdownDisabled = disabled || !hasMenuActions;

    return (
        <div className={cn('flex items-stretch min-w-fit', className)}>
            <Toolbar.Item asChild disabled={isPrimaryDisabled}>
                <Button
                    className={cn(hasMenuActions && 'rounded-r-none border-r-0', 'focus-visible:z-1')}
                    size='sm'
                    iconStrokeWidth={2}
                    aria-label={primaryState.label}
                    label={primaryState.label}
                    onClick={() => primaryState.action.execute()}
                />
            </Toolbar.Item>

            <Menu>
                <Tooltip delay={300} value={moreLabel} asChild>
                    <Toolbar.Item asChild disabled={isDropdownDisabled}>
                        <Menu.Trigger asChild>
                            <IconButton
                                className={cn(hasMenuActions ? 'p-0 rounded-l-none' : 'hidden', triggerClassName)}
                                size='sm'
                                iconStrokeWidth={2}
                                aria-label={moreLabel}
                                icon={ChevronDown}
                            />
                        </Menu.Trigger>
                    </Toolbar.Item>
                </Tooltip>
                <Menu.Portal>
                    <Menu.Content align="end">
                        {menuStates.map(({enabled, label, action}, index) => {
                            return (
                                <Menu.Item key={index} disabled={!enabled} onSelect={() => action.execute()}>
                                    <span className='font-semibold'>{label}</span>
                                </Menu.Item>
                            );
                        })}
                    </Menu.Content>
                </Menu.Portal>
            </Menu>
        </div>

    );
};

SplitActionButton.displayName = 'SplitActionButton';
