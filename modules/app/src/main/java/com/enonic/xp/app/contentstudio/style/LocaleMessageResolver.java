package com.enonic.xp.app.contentstudio.style;

import java.util.Collections;
import java.util.Locale;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;
import com.enonic.xp.web.servlet.ServletRequestHolder;

public final class LocaleMessageResolver
{
    private LocaleService localeService;

    private ApplicationKey applicationKey;

    public LocaleMessageResolver( final LocaleService localeService, final ApplicationKey applicationKey )
    {
        this.localeService = localeService;
        this.applicationKey = applicationKey;
    }

    public String localizeMessage( final String key, final String defaultValue )
    {
        final MessageBundle bundle = this.localeService.getBundle( applicationKey, getLocale() );

        if ( bundle == null )
        {
            return defaultValue;
        }
        final String localizedValue = bundle.localize( key );
        return localizedValue != null ? localizedValue : defaultValue;
    }

    private Locale getLocale()
    {
        final HttpServletRequest req = ServletRequestHolder.getRequest();
        if ( req == null )
        {
            return null;
        }

        return localeService.getSupportedLocale( Collections.list( req.getLocales() ) , applicationKey );
    }
}
