import type { Phrases, PhraseValue, Translate } from '@enonic/ui-utils';
import { fromPhrases, localize } from '@enonic/ui-utils';
import { atom } from 'nanostores';

export const $phrases = atom<Phrases>({});

export function setPhrases(phrases: Phrases): void {
    $phrases.set(phrases);
}

export function i18n(key: string, ...values: PhraseValue[]): string {
    return localize($phrases.get(), key, ...values);
}

export const translate: Translate = fromPhrases(() => $phrases.get());
