import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Button, cn, IconButton, Menu, Toolbar, Tooltip} from '@enonic/ui';
import {ChevronDown} from 'lucide-react';
import {Fragment, ReactElement, useMemo} from 'react';
import {useAction} from '../../../hooks/useAction';
import {useI18n} from '../../../hooks/useI18n';

export type SplitActionButtonAction = {
    action: Action;
};

type Props = {
    actions: SplitActionButtonAction[];
    className?: string;
};

// TODO: Enonic UI - Move to @enonic/ui
/**
 * A split button component with a primary action button and a dropdown menu.
 *
 * - The main button executes the first enabled action immediately when clicked
 * - The dropdown chevron button opens a menu with all other enabled actions
 * - The buttons are visually joined together as a single unit
 */
export const SplitActionButton = ({actions, className}: Props): ReactElement | null => {
    // Subscribe to all actions to track their state
    const actionStates = actions.map(({action}) => ({
        ...useAction(action),
    }));

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

    const hasMenuActions = menuStates.some((state) => state.enabled);

    const moreLabel = useI18n('tooltip.moreActions');

    if (!primaryState || actions.length === 0) {
        return null;
    }

    // const isDropdownDisabled = !primaryState.enabled || !hasMenuActions;

    return (
        <div className={cn('flex items-stretch', className)}>
            <Toolbar.Item asChild>
                <Button
                    className={cn(hasMenuActions && 'rounded-r-none border-r-0', 'focus-visible:z-1')}
                    size="sm"
                    iconStrokeWidth={2}
                    aria-label={primaryState.label}
                    label={primaryState.label}
                    disabled={!primaryState.enabled}
                    onClick={() => primaryState.execute()}
                />
            </Toolbar.Item>

            <Menu>
                <Tooltip delay={300} value={moreLabel} asChild>
                    <Toolbar.Item asChild>
                        <Menu.Trigger asChild>
                            <IconButton
                                className={cn(hasMenuActions ? 'p-0 rounded-l-none' : 'hidden')}
                                size="sm"
                                iconStrokeWidth={2}
                                aria-label={moreLabel}
                                icon={ChevronDown}
                                disabled={!primaryState.enabled}
                            />
                        </Menu.Trigger>
                    </Toolbar.Item>
                </Tooltip>
                <Menu.Portal>
                    <Menu.Content align="end">
                        {menuStates.map((state, index) => {
                            return (
                                <Menu.Item key={index} disabled={!state.enabled} onSelect={() => state.execute()}>
                                    <span className="font-semibold">{state.label}</span>
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
