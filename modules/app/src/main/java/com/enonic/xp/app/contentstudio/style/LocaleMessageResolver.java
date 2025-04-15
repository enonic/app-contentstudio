package com.enonic.xp.app.contentstudio.style;

import java.util.List;
import java.util.Locale;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;

public final class LocaleMessageResolver
{
    private final LocaleService localeService;

    private final ApplicationKey applicationKey;

    public LocaleMessageResolver( final LocaleService localeService, final ApplicationKey applicationKey )
    {
        this.localeService = localeService;
        this.applicationKey = applicationKey;
    }

    public String localizeMessage( final String key, final String defaultValue, final List<Locale> locales)
    {
        final MessageBundle bundle = this.localeService.getBundle( applicationKey, getLocale(locales) );

        if ( bundle == null )
        {
            return defaultValue;
        }
        final String localizedValue = bundle.localize( key );
        return localizedValue != null ? localizedValue : defaultValue;
    }

    private Locale getLocale( final List<Locale> locales )
    {
        return localeService.getSupportedLocale( locales , applicationKey );
    }
}
