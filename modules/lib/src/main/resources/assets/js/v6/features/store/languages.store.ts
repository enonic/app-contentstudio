import type {Locale} from '@enonic/lib-admin-ui/locale/Locale';
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
    locales: Locale[];
    loading: boolean;
    loaded: boolean;
};

//
// * Store
//

const initialState: Readonly<LanguagesStoreState> = {
    languages: [],
    locales: [],
    loading: false,
    loaded: false,
};

export const $languagesStore = map<LanguagesStoreState>(structuredClone(initialState));

//
// * Derived state
//

export const $languages = computed($languagesStore, (state) => state.languages);
export const $locales = computed($languagesStore, (state) => state.locales);
export const $languagesLoading = computed($languagesStore, (state) => state.loading);
export const $languagesLoaded = computed($languagesStore, (state) => state.loaded);

//
// * Loader — runs once at module load
//

async function loadLanguages(): Promise<void> {
    const {loading, loaded} = $languagesStore.get();
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
            locales,
            loading: false,
            loaded: true,
        });
    } catch (error) {
        console.error('Failed to load languages:', error);
        // Mark loaded so downstream readiness gates don't block forever.
        $languagesStore.set({
            languages: [],
            locales: [],
            loading: false,
            loaded: true,
        });
    }
}

void loadLanguages();

//
// * Actions
//

export function clearLanguageCache(): void {
    $languagesStore.set(structuredClone(initialState));
}

//
// * Selectors
//

export function getLanguageById(id: string): LanguageOption | undefined {
    return $languagesStore.get().languages.find((lang) => lang.id === id);
}
