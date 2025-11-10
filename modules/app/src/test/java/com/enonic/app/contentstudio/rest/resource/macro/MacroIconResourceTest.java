package com.enonic.app.contentstudio.rest.resource.macro;

import com.enonic.app.contentstudio.rest.resource.AdminResourceTestSupport;
import com.enonic.xp.form.Form;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.jaxrs.impl.MockRestResponse;
import com.enonic.xp.macro.MacroDescriptor;
import com.enonic.xp.macro.MacroDescriptorService;
import com.enonic.xp.macro.MacroKey;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.io.InputStream;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class MacroIconResourceTest
    extends AdminResourceTestSupport
{

    private MacroDescriptorService macroDescriptorService;

    private static final MacroImageHelper HELPER = new MacroImageHelper();

    @Override
    protected Object getResourceInstance()
    {
        this.macroDescriptorService = Mockito.mock( MacroDescriptorService.class );

        MacroIconResource macroIconResource = new MacroIconResource();
        macroIconResource.setMacroDescriptorService( this.macroDescriptorService );

        return macroIconResource;
    }

    @Test
    public void testGetDefaultIcon()
        throws Exception
    {
        MockRestResponse response = request().
                path( "macro/icon/non-existing" ).
                get();

        final byte[] defaultMacroImage = HELPER.getDefaultMacroImage();

        assertNotNull( response.getAsString() );
        assertEquals( MacroIconResource.DEFAULT_MIME_TYPE, response.getHeader("Content-Type") );

        Assertions.assertArrayEquals( defaultMacroImage, response.getData() );
    }

    @Test
    public void testMacroIcon()
        throws Exception
    {
        final byte[] data;
        try (InputStream stream = getClass().getResourceAsStream( "macro1.svg" ))
        {
            data = stream.readAllBytes();
        }
        final Icon icon = Icon.from( data, "image/svg+xml", Instant.now() );

        final MacroDescriptor macroDescriptor = MacroDescriptor.create().
            key( MacroKey.from( "myapp:macro1" ) ).
            description( "my description" ).
            displayName( "my macro1 name" ).
            form( Form.create().build() ).
            icon( icon ).
            build();

        Mockito.when( macroDescriptorService.getByKey( macroDescriptor.getKey() ) ).thenReturn( macroDescriptor );

        final MockRestResponse response = request().
                path( "macro/icon/myapp:macro1" ).
                get();

        assertNotNull( response.getAsString() );
        assertEquals( icon.getMimeType(), response.getHeader("Content-Type") );
        Assertions.assertArrayEquals( data, response.getData() );
    }
}
