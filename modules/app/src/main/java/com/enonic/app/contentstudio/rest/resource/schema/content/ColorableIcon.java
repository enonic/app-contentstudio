package com.enonic.app.contentstudio.rest.resource.schema.content;

import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.enonic.xp.icon.Icon;

/**
 * An SVG icon is colorable when every paint it declares is {@code currentColor} (or paints nothing),
 * so the client may render it as a mask filled with the surrounding text colour.
 */
final class ColorableIcon
{
    private static final Pattern PAINT = Pattern.compile( "(?:fill|stroke|stop-color|flood-color|lighting-color|color)\\s*[=:]\\s*[\"']?\\s*([^\"';)]+)" );

    private static final Set<String> NEUTRAL_PAINTS = Set.of( "none", "currentcolor", "inherit", "transparent" );

    private ColorableIcon()
    {
    }

    static boolean isColorable( final Icon icon )
    {
        if ( icon == null || !"image/svg+xml".equals( icon.getMimeType() ) )
        {
            return false;
        }

        final String svg = new String( icon.toByteArray(), StandardCharsets.UTF_8 ).toLowerCase();
        if ( !svg.contains( "currentcolor" ) )
        {
            return false;
        }

        final Matcher matcher = PAINT.matcher( svg );
        while ( matcher.find() )
        {
            if ( !NEUTRAL_PAINTS.contains( matcher.group( 1 ).trim() ) )
            {
                return false;
            }
        }
        return true;
    }
}
