import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {Button, cn, IconButton, Menu, Toolbar, Tooltip} from '@enonic/ui';
import {ChevronDown} from 'lucide-react';
import {type ReactElement, useMemo} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {useObservedActions} from './useObservedActions';

export type SplitActionButtonAction = {
    action: Action;
};

type Props = {
    actions: SplitActionButtonAction[];
    className?: string;
    disabled?: boolean;
    /**
     * Which action becomes the primary button.
     * - `firstEnabled`: the first enabled visible action (default).
     * - `firstVisible`: the first visible action regardless of enabled state,
     *   so ordering stays stable as actions toggle enabled/disabled.
     */
    primaryActionStrategy?: 'firstEnabled' | 'firstVisible';
    /**
     * When true (default), the dropdown trigger is disabled if every menu
     * action is disabled. Set to false to keep the trigger interactive even
     * when all menu actions are disabled (e.g. to let users still open the
     * menu and see the available actions).
     */
    disableMenuWhenAllMenuActionsDisabled?: boolean;
};

type ActionState = {
    action: Action;
    label: string;
    enabled: boolean;
    visible: boolean;
};

const getActionState = (action: Action): ActionState => ({
    action,
    label: action.getLabel(),
    enabled: action.isEnabled(),
    visible: action.isVisible(),
});

const SPLIT_ACTION_BUTTON_NAME = 'SplitActionButton';

// TODO: Enonic UI - Move to @enonic/ui
/**
 * A split button component with a primary action button and a dropdown menu.
 *
 * - The main button executes the selected primary action immediately when clicked
 * - The dropdown chevron button opens a menu with all other actions
 * - The buttons are visually joined together as a single unit
 */
export const SplitActionButton = ({
    actions,
    className,
    disabled = false,
    primaryActionStrategy = 'firstEnabled',
    disableMenuWhenAllMenuActionsDisabled = true,
}: Props): ReactElement | null => {
    const moreLabel = useI18n('tooltip.moreActions');
    const observedActions = useMemo(() => actions.map(({action}) => action), [actions]);
    const renderVersion = useObservedActions(observedActions);

    const actionStates = useMemo(
        () => actions.map(({action}) => getActionState(action)).filter(({visible}) => visible),
        [actions, renderVersion]
    );

    const primaryIndex = useMemo(() => {
        if (primaryActionStrategy === 'firstVisible') {
            return 0;
        }

        const firstEnabledIndex = actionStates.findIndex((state) => state.enabled);
        return firstEnabledIndex !== -1 ? firstEnabledIndex : 0;
    }, [actionStates, primaryActionStrategy]);

    const primaryState = actionStates[primaryIndex];
    const menuStates = useMemo(
        () => [...actionStates.slice(0, primaryIndex), ...actionStates.slice(primaryIndex + 1)],
        [actionStates, primaryIndex]
    );

    const hasMenuActions = menuStates.length > 0;
    const areAllMenuActionsDisabled = menuStates.every(({enabled}) => !enabled);

    if (!primaryState || actions.length === 0) {
        return null;
    }

    const isPrimaryDisabled = disabled || !primaryState.enabled;
    const isDropdownDisabled = disabled
        || !hasMenuActions
        || (disableMenuWhenAllMenuActionsDisabled && areAllMenuActionsDisabled);

    return (
        <div className={cn('flex items-stretch min-w-fit', className)} data-component={SPLIT_ACTION_BUTTON_NAME}>
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
                                className={cn('mr-1.5 sm:mr-0 w-6 sm:size-9', hasMenuActions ? 'p-0 rounded-l-none' : 'hidden')}
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

SplitActionButton.displayName = SPLIT_ACTION_BUTTON_NAME;
