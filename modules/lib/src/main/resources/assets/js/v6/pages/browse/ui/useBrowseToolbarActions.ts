import { useStore } from '@nanostores/preact';
import { useMemo } from 'react';
import { i18n } from '../../../shared/i18n';
import { type ToolbarAction } from '../../../widgets/browse-toolbar/toolbarAction';
import { executeBrowseAction } from '../model/browseActions.commands';
import { $browseActions, type BrowseActionId } from '../model/browseActions.store';

/** The browse actions with the given ids, in that order, as toolbar actions. */
export function useBrowseToolbarActions<T extends BrowseActionId>(ids: readonly T[]): (ToolbarAction & { id: T })[] {
    const actions = useStore($browseActions);

    return useMemo(
        () =>
            ids.map((id) => ({
                id,
                label: i18n(actions[id].labelKey),
                enabled: actions[id].enabled,
                visible: actions[id].visible,
                execute: () => executeBrowseAction(id),
            })),
        [actions, ids],
    );
}
