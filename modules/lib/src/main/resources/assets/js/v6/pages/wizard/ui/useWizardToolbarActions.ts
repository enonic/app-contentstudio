import { useStore } from '@nanostores/preact';
import { useMemo } from 'react';
import { executeWizardAction } from '../model/wizardActions.commands';
import {
    $wizardActions,
    $wizardSaveLabel,
    type WizardActionId,
    type WizardSaveLabel,
} from '../model/wizardActions.store';
import { i18n } from '../../../shared/i18n';
import { type ToolbarAction } from '../../../widgets/browse-toolbar/toolbarAction';

const SAVE_LABEL_KEYS: Record<WizardSaveLabel, string> = {
    save: 'action.save',
    saving: 'action.saving',
    saved: 'action.saved',
};

const LABEL_KEYS: Record<WizardActionId, string> = {
    save: 'action.save',
    saveAndClose: 'action.save',
    archive: 'action.delete',
    duplicate: 'action.duplicate',
    move: 'action.move',
    publish: 'action.publish',
    publishTree: 'action.publishTree',
    unpublish: 'action.unpublish',
    markAsReady: 'action.markAsReady',
    requestPublish: 'action.requestPublish',
    openRequest: 'action.openRequest',
    createIssue: 'action.createIssue',
    reset: 'action.reset',
    localize: 'action.translate',
    preview: 'action.preview',
};

/** The wizard actions with the given ids, in that order, as toolbar actions. */
export function useWizardToolbarActions<T extends WizardActionId>(ids: readonly T[]): (ToolbarAction & { id: T })[] {
    const actions = useStore($wizardActions);
    const saveLabel = useStore($wizardSaveLabel);

    return useMemo(
        () =>
            ids.map((id) => ({
                id,
                label: i18n(id === 'save' ? SAVE_LABEL_KEYS[saveLabel] : LABEL_KEYS[id]),
                enabled: actions[id].enabled,
                visible: actions[id].visible,
                execute: () => executeWizardAction(id),
            })),
        [actions, ids, saveLabel],
    );
}
