import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import type {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {computed, map} from 'nanostores';
import type {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentLanguageUpdatedEvent} from '../../../../app/event/ContentLanguageUpdatedEvent';
import {GetContentByIdRequest} from '../../../../app/resource/GetContentByIdRequest';
import {UpdateContentMetadataRequest} from '../../../../app/resource/UpdateContentMetadataRequest';
import {CSPrincipalLoader} from '../../../../app/security/CSPrincipalLoader';
import {GetPrincipalsByKeysRequest} from '../../../../app/security/GetPrincipalsByKeysRequest';
import type {OwnerSelectorOption} from '../../shared/selectors/OwnerSelector';
import {loadLanguages} from '../languages.store';

//
// * Store state
//

type EditPropertiesDialogStore = {
    open: boolean;
    content?: ContentSummaryAndCompareStatus;
    ownerOptions: OwnerSelectorOption[];
    selectedOwnerOption?: OwnerSelectorOption;
    languageSelection: readonly string[];
    ownerSelection: readonly string[];
    saving: boolean;
};

const initialState: EditPropertiesDialogStore = {
    open: false,
    content: undefined,
    ownerOptions: [],
    selectedOwnerOption: undefined,
    languageSelection: [],
    ownerSelection: [],
    saving: false,
};

export const $editPropertiesDialog = map<EditPropertiesDialogStore>(structuredClone(initialState));

//
// * Derived state
//

export const $editPropertiesDialogOwnerOptions = computed(
    $editPropertiesDialog,
    ({ownerOptions, selectedOwnerOption}) => {
        if (!selectedOwnerOption) {
            return ownerOptions;
        }

        const hasSelected = ownerOptions.some(option => option.id === selectedOwnerOption.id);
        return hasSelected ? ownerOptions : [selectedOwnerOption, ...ownerOptions];
    },
);

//
// * Internal state
//

const principalLoader = new CSPrincipalLoader();
principalLoader.setAllowedTypes([PrincipalType.USER]);

let ownerSearchToken = 0;
let instanceId = 0;

//
// * Helpers
//

const toOwnerOption = (principal: Principal): OwnerSelectorOption => ({
    id: principal.getKey().toString(),
    label: principal.getDisplayName(),
    description: principal.getKey().toPath(),
});

const resetEditPropertiesDialog = (): void => {
    instanceId += 1;
    ownerSearchToken += 1;
    $editPropertiesDialog.set(structuredClone(initialState));
};

//
// * Public API
//

export const openEditPropertiesDialog = (content: ContentSummaryAndCompareStatus): void => {
    const contentSummary = content?.getContentSummary();
    if (!contentSummary) {
        return;
    }

    instanceId += 1;
    ownerSearchToken += 1;

    const language = contentSummary.getLanguage();
    const ownerKey = contentSummary.getOwner()?.toString();

    $editPropertiesDialog.set({
        ...structuredClone(initialState),
        open: true,
        content,
        languageSelection: language ? [language] : [],
        ownerSelection: ownerKey ? [ownerKey] : [],
    });

    void loadLanguages();
    void loadEditPropertiesOwnerOption(contentSummary.getOwner(), instanceId);
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
    const state = $editPropertiesDialog.get();
    const nextId = selection[0];

    let selectedOwnerOption = state.selectedOwnerOption;
    if (!nextId) {
        selectedOwnerOption = undefined;
    } else if (selectedOwnerOption?.id !== nextId) {
        selectedOwnerOption = state.ownerOptions.find(option => option.id === nextId);
    }

    $editPropertiesDialog.set({
        ...state,
        ownerSelection: selection,
        selectedOwnerOption,
    });
};

export const searchEditPropertiesOwners = async (value: string): Promise<void> => {
    const requestId = ownerSearchToken + 1;
    ownerSearchToken = requestId;
    try {
        const principals = await principalLoader.search(value);
        if (ownerSearchToken !== requestId) {
            return;
        }
        $editPropertiesDialog.setKey('ownerOptions', principals.map(toOwnerOption));
    } catch (error) {
        console.error(error);
    }
};

export const applyEditPropertiesDialog = async (): Promise<void> => {
    const state = $editPropertiesDialog.get();
    const contentSummary = state.content?.getContentSummary();

    if (!contentSummary || state.saving) {
        return;
    }

    $editPropertiesDialog.setKey('saving', true);

    try {
        const contentItem = await new GetContentByIdRequest(contentSummary.getContentId()).sendAndParse();
        const request = UpdateContentMetadataRequest.create(contentItem);

        if (state.languageSelection[0]) {
            request.setLanguage(state.languageSelection[0]);
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

//
// * Internal loaders
//

const loadEditPropertiesOwnerOption = async (
    ownerKey: PrincipalKey | undefined,
    currentInstance: number,
): Promise<void> => {
    if (!ownerKey) {
        $editPropertiesDialog.setKey('selectedOwnerOption', undefined);
        return;
    }

    try {
        const principals = await new GetPrincipalsByKeysRequest([ownerKey]).sendAndParse();
        if (instanceId !== currentInstance) {
            return;
        }
        const principal = principals[0];
        if (principal) {
            $editPropertiesDialog.setKey('selectedOwnerOption', toOwnerOption(principal));
        }
    } catch (error) {
        console.error(error);
    }
};
