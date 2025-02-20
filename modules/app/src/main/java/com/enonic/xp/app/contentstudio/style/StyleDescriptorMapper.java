package com.enonic.xp.app.contentstudio.style;

import java.util.LinkedHashMap;
import java.util.Map;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapSerializable;
import com.enonic.xp.style.ElementStyle;
import com.enonic.xp.style.ImageStyle;
import com.enonic.xp.style.StyleDescriptor;
import com.enonic.xp.style.StyleDescriptors;

public class StyleDescriptorMapper
    implements MapSerializable
{
    private final StyleDescriptors styleDescriptors;

    private final LocaleService localeService;

    public StyleDescriptorMapper( final StyleDescriptors styleDescriptors, final LocaleService localeService )
    {
        this.styleDescriptors = styleDescriptors;
        this.localeService = localeService;
    }

    @Override
    public void serialize( final MapGenerator gen )
    {
        final Map<String, ElementStyle> styles = new LinkedHashMap<>();
        final Map<String, ApplicationKey> stylesApps = new LinkedHashMap<>();

        gen.array( "css" );
        for ( StyleDescriptor styleDescriptor : this.styleDescriptors )
        {
            gen.value( styleDescriptor.getCssPath() );

            for ( ElementStyle styleElement : styleDescriptor.getElements() )
            {
                styles.put( styleElement.getName(), styleElement );
                stylesApps.put( styleElement.getName(), styleDescriptor.getApplicationKey() );
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

    private void serializeElement( final MapGenerator gen, final ElementStyle element, final ApplicationKey applicationKey )
    {
        gen.map();

        gen.value( "element", element.getElement() );
        gen.value( "name", element.getName() );
        gen.value( "displayName", localizeDisplayName( element, applicationKey ) );

        if ( element instanceof ImageStyle )
        {
            serializeImage( gen, (ImageStyle) element );
        }

        gen.end();
    }

    private void serializeImage( final MapGenerator gen, final ImageStyle element )
    {
        gen.value( "filter", element.getFilter() );
        gen.value( "aspectRatio", element.getAspectRatio() );
    }

    private String localizeDisplayName( final ElementStyle styleElement, final ApplicationKey applicationKey )
    {
        LocaleMessageResolver localeMessageResolver = new LocaleMessageResolver( localeService, applicationKey );
        if ( !isBlank( styleElement.getDisplayNameI18nKey() ) )
        {
            return localeMessageResolver.localizeMessage( styleElement.getDisplayNameI18nKey(), styleElement.getDisplayName() );
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
