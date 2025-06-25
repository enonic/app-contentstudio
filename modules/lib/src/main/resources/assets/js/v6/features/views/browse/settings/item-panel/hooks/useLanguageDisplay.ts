import {useEffect} from 'react';
import {useStore} from '@nanostores/preact';
import {$languages, getLanguageById, loadLanguages} from '../../../../../store/languages.store';

type UseLanguageDisplayResult = {
    label: string | null;
};

export function useLanguageDisplay(languageCode: string | null | undefined): UseLanguageDisplayResult {
    // Subscribe to store for reactivity
    useStore($languages);

    useEffect(() => {
        void loadLanguages();
    }, []);

    if (!languageCode) {
        return {label: null};
    }

    const language = getLanguageById(languageCode);
    return {label: language?.label ?? languageCode};
}
