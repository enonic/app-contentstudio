package com.enonic.app.contentstudio.rest.resource.content.page.part;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.core.HttpHeaders;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.enonic.xp.descriptor.DescriptorKey;
import com.enonic.xp.form.Form;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.region.PartDescriptor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PartDescriptorIconUrlResolverTest
{
    private PartDescriptorIconUrlResolver resolver;

    @BeforeEach
    void setUp()
    {
        final HttpServletRequest request = mock( HttpServletRequest.class );
        when( request.getHeader( HttpHeaders.HOST ) ).thenReturn( "localhost" );
        when( request.getRequestURL() ).thenReturn( new StringBuffer( "http://localhost/api/admin/contentstudio" ) );
        when( request.getServerName() ).thenReturn( "localhost" );

        resolver = new PartDescriptorIconUrlResolver( request );
    }

    @Test
    void currentColorSvgIsMarkedColorable()
    {
        final String url = resolver.resolve( part( svg( "<svg xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"currentColor\" d=\"M1 1\"/></svg>" ) ) );

        assertThat( url ).contains( "/content/page/part/descriptor/icon/app:part?hash=" ).endsWith( "&colorable=true" );
    }

    @Test
    void hardCodedColourSvgIsNotMarkedColorable()
    {
        final String url = resolver.resolve( part( svg( "<svg xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"#333\" d=\"M1 1\"/></svg>" ) ) );

        assertThat( url ).contains( "?hash=" ).doesNotContain( "colorable" );
    }

    @Test
    void partWithoutIconHasNoUrl()
    {
        assertThat( resolver.resolve( part( null ) ) ).isNull();
    }

    private static Icon svg( final String markup )
    {
        return Icon.from( markup.getBytes( StandardCharsets.UTF_8 ), "image/svg+xml", Instant.EPOCH );
    }

    private static PartDescriptor part( final Icon icon )
    {
        return PartDescriptor.create().key( DescriptorKey.from( "app:part" ) ).config( Form.create().build() ).icon( icon ).build();
    }
}
