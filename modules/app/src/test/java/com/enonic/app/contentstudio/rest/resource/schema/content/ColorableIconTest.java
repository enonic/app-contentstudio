package com.enonic.app.contentstudio.rest.resource.schema.content;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

import org.junit.jupiter.api.Test;

import com.enonic.xp.icon.Icon;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ColorableIconTest
{
    private static Icon svg( final String markup )
    {
        return Icon.from( markup.getBytes( StandardCharsets.UTF_8 ), "image/svg+xml", Instant.EPOCH );
    }

    @Test
    void lucideStyleIconIsColorable()
    {
        assertTrue( ColorableIcon.isColorable( svg(
            "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\">" +
                "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"4\"/><circle cx=\"17\" cy=\"17\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/></svg>" ) ) );
    }

    @Test
    void currentColorIsCaseInsensitive()
    {
        assertTrue( ColorableIcon.isColorable( svg( "<svg xmlns=\"http://www.w3.org/2000/svg\"><path stroke=\"currentcolor\" fill=\"NONE\" d=\"M1 1\"/></svg>" ) ) );
        assertTrue( ColorableIcon.isColorable(
            svg( "<svg xmlns=\"http://www.w3.org/2000/svg\"><path style=\"fill:currentColor;stroke:none\" d=\"M1 1\"/></svg>" ) ) );
    }

    @Test
    void hardCodedColourIsNotColorable()
    {
        assertFalse( ColorableIcon.isColorable( svg( "<svg xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"#52575E\" d=\"M1 1\"/></svg>" ) ) );
        assertFalse( ColorableIcon.isColorable(
            svg( "<svg xmlns=\"http://www.w3.org/2000/svg\"><style>.a{fill:#333}</style><path class=\"a\" stroke=\"currentColor\"/></svg>" ) ) );
        assertFalse( ColorableIcon.isColorable(
            svg( "<svg xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"url(#g)\" stroke=\"currentColor\"/></svg>" ) ) );
        assertFalse( ColorableIcon.isColorable(
            svg( "<svg xmlns=\"http://www.w3.org/2000/svg\" color=\"#333\"><path fill=\"currentColor\"/></svg>" ) ) );
    }

    @Test
    void svgWithoutCurrentColorIsNotColorable()
    {
        assertFalse( ColorableIcon.isColorable( svg( "<svg xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M1 1\"/></svg>" ) ) );
    }

    @Test
    void rasterIsNotColorable()
    {
        assertFalse( ColorableIcon.isColorable( Icon.from( new byte[]{1, 2, 3}, "image/png", Instant.EPOCH ) ) );
        assertFalse( ColorableIcon.isColorable( null ) );
    }
}
