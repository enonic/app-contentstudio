import {LangDirection} from '@enonic/lib-admin-ui/dom/Element';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';

export const getHtmlAreaLangDirection = (language?: string): LangDirection => {
    return language && Locale.supportsRtl(language) ? LangDirection.RTL : LangDirection.AUTO;
};

export const normalizeHtmlAreaLangDirection = (direction?: string): LangDirection => {
    if (direction === 'ltr') {
        return LangDirection.LTR;
    }

    if (direction === 'rtl') {
        return LangDirection.RTL;
    }

    return LangDirection.AUTO;
};
