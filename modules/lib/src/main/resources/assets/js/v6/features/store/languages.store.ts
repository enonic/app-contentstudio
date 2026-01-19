import {computed, map} from 'nanostores';
import {GetLocalesRequest} from '../../../app/resource/GetLocalesRequest';
import {LocaleViewer} from '../../../app/locale/LocaleViewer';

//
// * Types
//

export type LanguageOption = {
    id: string;
    label: string;
};

type LanguagesStoreState = {
    languages: LanguageOption[];
    loading: boolean;
    loaded: boolean;
};

//
// * Store
//

const initialState: LanguagesStoreState = {
    languages: [],
    loading: false,
    loaded: false,
};

export const $languagesStore = map<LanguagesStoreState>(structuredClone(initialState));

//
// * Derived state
//

export const $languages = computed($languagesStore, (state) => state.languages);
export const $languagesLoading = computed($languagesStore, (state) => state.loading);

//
// * Actions
//

export async function loadLanguages(): Promise<void> {
    const {loading, loaded} = $languagesStore.get();

    // Skip if already loaded or currently loading
    if (loaded || loading) {
        return;
    }

    $languagesStore.setKey('loading', true);

    try {
        const locales = await new GetLocalesRequest().sendAndParse();
        $languagesStore.set({
            languages: locales.map((locale) => ({
                id: locale.getId(),
                label: LocaleViewer.makeDisplayName(locale),
            })),
            loading: false,
            loaded: true,
        });
    } catch (error) {
        console.error('Failed to load languages:', error);
        $languagesStore.setKey('loading', false);
    }
}

export function clearLanguageCache(): void {
    $languagesStore.set(structuredClone(initialState));
}

//
// * Selectors
//

export function getLanguageById(id: string): LanguageOption | undefined {
    return $languagesStore.get().languages.find((lang) => lang.id === id);
}
