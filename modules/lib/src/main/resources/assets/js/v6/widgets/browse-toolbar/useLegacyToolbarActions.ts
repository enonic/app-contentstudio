import { type Action } from '@enonic/lib-admin-ui/ui/Action';
import { useMemo } from 'react';
import { type ToolbarAction } from './toolbarAction';
import { useObservedActions } from './useObservedActions';

export type LegacyToolbarActionSource = {
    id: string;
    action: Action;
};

/**
 * Reads lib-admin-ui actions as plain toolbar actions and keeps them current.
 * For the wizard toolbar only, until its actions leave the legacy `Action`.
 */
export function useLegacyToolbarActions<T extends LegacyToolbarActionSource>(
    sources: readonly T[],
): (Omit<T, 'action'> & ToolbarAction)[] {
    const actions = useMemo(() => sources.map(({ action }) => action), [sources]);
    const renderVersion = useObservedActions(actions);

    return useMemo(
        () =>
            sources.map(({ action, ...rest }) => ({
                ...rest,
                label: action.getLabel(),
                enabled: action.isEnabled(),
                visible: action.isVisible(),
                execute: () => {
                    action.execute();
                },
            })),
        // ? `renderVersion` ticks when any observed action changes a property.
        [sources, renderVersion],
    );
}
