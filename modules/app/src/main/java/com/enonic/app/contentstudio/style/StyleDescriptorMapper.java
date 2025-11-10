package com.enonic.app.contentstudio.style;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapSerializable;
import com.enonic.xp.style.ImageStyle;
import com.enonic.xp.style.StyleDescriptor;
import com.enonic.xp.style.StyleDescriptors;

public class StyleDescriptorMapper
    implements MapSerializable
{
    private final StyleDescriptors styleDescriptors;

    private final LocaleService localeService;

    private final List<Locale> locales;

    public StyleDescriptorMapper( final StyleDescriptors styleDescriptors, final LocaleService localeService,
                                  final List<Locale> locales )
    {
        this.styleDescriptors = styleDescriptors;
        this.localeService = localeService;
        this.locales = locales;
    }

    @Override
    public void serialize( final MapGenerator gen )
    {
        final Map<String, ImageStyle> styles = new LinkedHashMap<>();
        final Map<String, ApplicationKey> stylesApps = new LinkedHashMap<>();

        gen.array( "css" );
        for ( StyleDescriptor styleDescriptor : this.styleDescriptors )
        {
            gen.value( styleDescriptor.getCssPath() );

            for ( var styleElement : styleDescriptor.getElements() )
            {
                if ( styleElement instanceof ImageStyle )
                {
                    styles.put( styleElement.getName(), (ImageStyle) styleElement );
                    stylesApps.put( styleElement.getName(), styleDescriptor.getApplicationKey() );
                }
            }
        }
        gen.end();

        gen.array( "app" );
        for ( StyleDescriptor styleDescriptor : this.styleDescriptors )
        {
            gen.value( styleDescriptor.getApplicationKey().toString() );
        }
        gen.end();

        gen.array( "styles" );
        for ( String styleElementName : styles.keySet() )
        {
            serializeElement( gen, styles.get( styleElementName ), stylesApps.get( styleElementName ) );
        }
        gen.end();
    }

    private void serializeElement( final MapGenerator gen, final ImageStyle element, final ApplicationKey applicationKey )
    {
        gen.map();

        gen.value( "element", "image" );
        gen.value( "name", element.getName() );
        gen.value( "displayName", localizeDisplayName( element, applicationKey ) );

         serializeImage( gen, element );

        gen.end();
    }

    private void serializeImage( final MapGenerator gen, final ImageStyle element )
    {
        gen.value( "filter", element.getFilter() );
        gen.value( "aspectRatio", element.getAspectRatio() );
    }

    private String localizeDisplayName( final ImageStyle styleElement, final ApplicationKey applicationKey )
    {
        LocaleMessageResolver localeMessageResolver = new LocaleMessageResolver( localeService, applicationKey );
        if ( !isBlank( styleElement.getDisplayNameI18nKey() ) )
        {
            return localeMessageResolver.localizeMessage( styleElement.getDisplayNameI18nKey(), styleElement.getDisplayName(), locales );
        }
        else
        {
            return styleElement.getDisplayName();
        }
    }

    private boolean isBlank(String str) {
        int strLen;
        if (str != null && (strLen = str.length()) != 0) {
            for(int i = 0; i < strLen; ++i) {
                if (!Character.isWhitespace(str.charAt(i))) {
                    return false;
                }
            }

            return true;
        } else {
            return true;
        }
    }
}
