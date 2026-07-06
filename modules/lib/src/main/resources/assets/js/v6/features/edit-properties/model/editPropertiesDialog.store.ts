import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { showFeedback } from '@enonic/lib-admin-ui/notify/MessageBus';
import { PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { ResultAsync } from 'neverthrow';
import { map } from 'nanostores';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { ContentLanguageUpdatedEvent } from '../../../../app/event/ContentLanguageUpdatedEvent';
import { fetchContentById } from '../../../entities/content';
import { loadPrincipalsByKeys } from '../../../entities/principal';
import { type AppError } from '../../../shared/api/errors';
import { updateContentLanguage, updateContentMetadata } from '../api/properties.api';

//
// * Store state
//

type EditPropertiesDialogStore = {
    open: boolean;
    content?: ContentSummary;
    languageSelection: readonly string[];
    ownerSelection: readonly string[];
    saving: boolean;
};

const initialState: EditPropertiesDialogStore = {
    open: false,
    content: undefined,
    languageSelection: [],
    ownerSelection: [],
    saving: false,
};

export const $editPropertiesDialog = map<EditPropertiesDialogStore>(structuredClone(initialState));

//
// * Internal state
//

let instanceId = 0;

//
// * Helpers
//

const resetEditPropertiesDialog = (): void => {
    instanceId += 1;
    $editPropertiesDialog.set(structuredClone(initialState));
};

//
// * Public API
//

export const openEditPropertiesDialog = (content: ContentSummary): void => {
    if (!content) {
        return;
    }

    instanceId += 1;

    const language = content.getLanguage();
    const ownerKey = content.getOwner()?.toString();

    $editPropertiesDialog.set({
        ...structuredClone(initialState),
        open: true,
        content,
        languageSelection: language ? [language] : [],
        ownerSelection: ownerKey ? [ownerKey] : [],
    });

    if (ownerKey) {
        void loadPrincipalsByKeys([PrincipalKey.fromString(ownerKey)]);
    }
};

export const closeEditPropertiesDialog = (): void => {
    const { saving } = $editPropertiesDialog.get();
    if (saving) {
        return;
    }
    resetEditPropertiesDialog();
};

export const setEditPropertiesDialogLanguageSelection = (selection: readonly string[]): void => {
    $editPropertiesDialog.setKey('languageSelection', selection);
};

export const setEditPropertiesDialogOwnerSelection = (selection: readonly string[]): void => {
    $editPropertiesDialog.setKey('ownerSelection', selection);
};

export const applyEditPropertiesDialog = async (): Promise<void> => {
    const state = $editPropertiesDialog.get();
    const contentSummary = state.content;

    if (!contentSummary || state.saving) {
        return;
    }

    $editPropertiesDialog.setKey('saving', true);

    const contentResult = await fetchContentById(contentSummary.getContentId().toString());
    if (contentResult.isErr()) {
        DefaultErrorHandler.handle(contentResult.error);
        $editPropertiesDialog.setKey('saving', false);
        return;
    }

    const contentItem = contentResult.value;

    const previousLanguage = contentItem.getLanguage();
    const previousOwnerKey = contentItem.getOwner()?.toString();
    const nextLanguage = state.languageSelection[0];
    const nextOwnerKey = state.ownerSelection[0];

    const languageChanged = (nextLanguage ?? undefined) !== (previousLanguage ?? undefined);
    const ownerChanged = (nextOwnerKey ?? undefined) !== (previousOwnerKey ?? undefined);

    const updates: ResultAsync<void, AppError>[] = [];

    if (ownerChanged) {
        updates.push(
            updateContentMetadata(
                contentItem.getContentId(),
                nextOwnerKey ? PrincipalKey.fromString(nextOwnerKey) : undefined,
            ),
        );
    }

    if (languageChanged) {
        updates.push(updateContentLanguage(contentItem.getContentId(), nextLanguage));
    }

    if (updates.length > 0) {
        const result = await ResultAsync.combine(updates);
        if (result.isErr()) {
            DefaultErrorHandler.handle(result.error);
            $editPropertiesDialog.setKey('saving', false);
            return;
        }

        showFeedback(i18n('notify.properties.settings.updated', contentItem.getName().toString()));

        if (languageChanged) {
            new ContentLanguageUpdatedEvent(nextLanguage).fire();
        }
    }

    resetEditPropertiesDialog();
};
