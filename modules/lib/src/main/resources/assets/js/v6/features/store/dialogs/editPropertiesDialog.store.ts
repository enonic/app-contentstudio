import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {map} from 'nanostores';
import type {ContentSummary} from '../../../../app/content/ContentSummary';
import {ContentLanguageUpdatedEvent} from '../../../../app/event/ContentLanguageUpdatedEvent';
import {GetContentByIdRequest} from '../../../../app/resource/GetContentByIdRequest';
import {UpdateContentLanguageRequest} from '../../../../app/resource/UpdateContentLanguageRequest';
import {UpdateContentMetadataRequest} from '../../../../app/resource/UpdateContentMetadataRequest';
import {loadLanguages} from '../languages.store';
import {loadPrincipalsByKeys} from '../principals.store';

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

    void loadLanguages();
    if (ownerKey) {
        void loadPrincipalsByKeys([PrincipalKey.fromString(ownerKey)]);
    }
};

export const closeEditPropertiesDialog = (): void => {
    const {saving} = $editPropertiesDialog.get();
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

    try {
        const contentItem = await new GetContentByIdRequest(contentSummary.getContentId()).sendAndParse();

        const previousLanguage = contentItem.getLanguage();
        const previousOwnerKey = contentItem.getOwner()?.toString();
        const nextLanguage = state.languageSelection[0];
        const nextOwnerKey = state.ownerSelection[0];

        const languageChanged = (nextLanguage ?? undefined) !== (previousLanguage ?? undefined);
        const ownerChanged = (nextOwnerKey ?? undefined) !== (previousOwnerKey ?? undefined);

        const requests: PromiseLike<unknown>[] = [];

        if (ownerChanged) {
            const ownerRequest = new UpdateContentMetadataRequest(contentItem.getId());
            if (nextOwnerKey) {
                ownerRequest.setOwner(PrincipalKey.fromString(nextOwnerKey));
            }
            requests.push(ownerRequest.sendAndParse());
        }

        if (languageChanged) {
            requests.push(new UpdateContentLanguageRequest(contentItem.getId()).setLanguage(nextLanguage).sendAndParse());
        }

        if (requests.length > 0) {
            await Promise.all(requests);
            showFeedback(i18n('notify.properties.settings.updated', contentItem.getName().toString()));

            if (languageChanged) {
                new ContentLanguageUpdatedEvent(nextLanguage).fire();
            }
        }

        resetEditPropertiesDialog();
    } catch (error) {
        DefaultErrorHandler.handle(error);
        $editPropertiesDialog.setKey('saving', false);
    }
};
