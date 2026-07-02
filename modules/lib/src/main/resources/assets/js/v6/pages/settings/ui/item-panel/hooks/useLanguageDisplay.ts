import { useStore } from '@nanostores/preact';
import { $languages, getLanguageById } from '../../../../../entities/language';

type UseLanguageDisplayResult = {
    label: string | null;
};

export function useLanguageDisplay(languageCode: string | null | undefined): UseLanguageDisplayResult {
    useStore($languages);

    if (!languageCode) {
        return { label: null };
    }

    const language = getLanguageById(languageCode);
    return { label: language?.label ?? languageCode };
}
