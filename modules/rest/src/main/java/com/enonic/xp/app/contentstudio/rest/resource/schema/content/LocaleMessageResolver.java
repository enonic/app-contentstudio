package com.enonic.xp.app.contentstudio.rest.resource.schema.content;

import java.util.Collections;
import java.util.Enumeration;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;

public class LocaleMessageResolver
{
    private static final Logger LOG = LoggerFactory.getLogger( LocaleMessageResolver.class );

    private final MessageBundle bundle;

    public LocaleMessageResolver( final LocaleService localeService, final ApplicationKey applicationKey,
                                  final Enumeration<Locale> locales )
    {
        this.bundle =
            localeService.getBundle( applicationKey, localeService.getSupportedLocale( Collections.list( locales ), applicationKey ) );
    }

    public String localizeMessage( final String key, final String defaultValue, final Object... args )
    {
        if ( bundle == null )
        {
            return defaultValue;
        }
        final String localizedValue;
        try
        {
            localizedValue = bundle.localize( key, args );
        }
        catch ( IllegalArgumentException e )
        {
            LOG.error( "Error on localization of message with key [{}].", key, e );
            return bundle.getMessage( key );
        }

        return localizedValue != null ? localizedValue : defaultValue;
    }
}
