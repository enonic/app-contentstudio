package com.enonic.xp.app.contentstudio;

import java.util.Collections;
import java.util.List;
import java.util.Locale;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;
import com.enonic.xp.web.servlet.ServletRequestHolder;

import static java.util.stream.Collectors.toList;

final class StringTranslator
{
    private final LocaleService localeService;

    private final List<Locale> preferredLocales;

    public StringTranslator( final LocaleService localeService )
    {
        this.localeService = localeService;
        this.preferredLocales = getPreferredLocales();
    }

    public String localize( final ApplicationKey app, final String key, final String defaultValue )
    {
        final MessageBundle bundle = this.localeService.getBundle( app, getLocale( app ) );

        if ( bundle == null )
        {
            return defaultValue;
        }
        final String localizedValue = bundle.localize( key );
        return localizedValue != null ? localizedValue : defaultValue;
    }

    private Locale getLocale( final ApplicationKey app )
    {
        return localeService.getSupportedLocale( this.preferredLocales, app );
    }

    private List<Locale> getPreferredLocales()
    {
        final HttpServletRequest req = ServletRequestHolder.getRequest();
        if ( req == null )
        {
            return Collections.emptyList();
        }

        return Collections.list( req.getLocales() ).
            stream().
            map( this::resolveLanguage ).
            collect( toList() );
    }

    private Locale resolveLanguage( final Locale locale )
    {
        final String lang = locale.getLanguage();
        if ( lang.equals( "nn" ) || lang.equals( "nb" ) )
        {
            return new Locale( "no" );
        }
        return locale;
    }
}
