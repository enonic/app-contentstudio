import type { PhraseValue } from '@enonic/ui-utils';
import { i18n } from '../../i18n';

export function useI18n(key: string, ...values: PhraseValue[]): string {
    return i18n(key, ...values);
}
