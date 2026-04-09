import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {map} from 'nanostores';
import type {ContentSummary} from '../../../../app/content/ContentSummary';
import {ContentLanguageUpdatedEvent} from '../../../../app/event/ContentLanguageUpdatedEvent';
import {GetContentByIdRequest} from '../../../../app/resource/GetContentByIdRequest';
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
        const request = UpdateContentMetadataRequest.create(contentItem);

        if (state.languageSelection[0]) {
            request.setLanguage(state.languageSelection[0]);
        } else {
            request.setLanguage(undefined);
        }
        if (state.ownerSelection[0]) {
            request.setOwner(PrincipalKey.fromString(state.ownerSelection[0]));
        } else {
            request.setOwner(undefined);
        }

        const updatedContent = await request.sendAndParse();
        showFeedback(i18n('notify.properties.settings.updated', updatedContent.getName().toString()));

        if (updatedContent.getLanguage() && updatedContent.getLanguage() !== contentSummary.getLanguage()) {
            new ContentLanguageUpdatedEvent(updatedContent.getLanguage()).fire();
        }

        resetEditPropertiesDialog();
    } catch (error) {
        DefaultErrorHandler.handle(error);
        $editPropertiesDialog.setKey('saving', false);
    }
};
