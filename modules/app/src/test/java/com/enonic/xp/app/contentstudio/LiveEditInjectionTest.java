package com.enonic.xp.app.contentstudio;

import java.util.List;
import java.util.Locale;

import javax.servlet.http.HttpServletRequest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.google.common.base.Charsets;
import com.google.common.io.Resources;

import com.enonic.xp.portal.PortalRequest;
import com.enonic.xp.portal.PortalResponse;
import com.enonic.xp.portal.RenderMode;
import com.enonic.xp.portal.postprocess.HtmlTag;
import com.enonic.xp.web.servlet.ServletRequestHolder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

public class LiveEditInjectionTest
{
    private PortalRequest portalRequest;

    private PortalResponse portalResponse;

    private LiveEditInjection injection;

    @BeforeEach
    public void setup()
    {
        this.portalRequest = new PortalRequest();
        this.portalResponse = PortalResponse.create().build();
        mockCurrentContextHttpRequest();

        this.injection = new LiveEditInjection();
    }

    @Test
    public void testNoInjection()
    {
        this.portalRequest.setMode( RenderMode.EDIT );

        final List<String> result1 = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.HEAD_END );
        assertNull( result1 );

        final List<String> result2 = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.BODY_BEGIN );
        assertNull( result2 );

        this.portalRequest.setMode( RenderMode.LIVE );

        final List<String> result3 = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.BODY_END );
        assertNull( result3 );
    }

    @Test
    public void testInjectHeadBegin()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.EDIT );

        final List<String> list = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.HEAD_BEGIN );
        assertNotNull( list );

        final String result = list.get( 0 );
        assertNotNull( result );
        assertEquals( readResource( "liveEditInjectionHeadBegin.html" ).trim() + System.lineSeparator(), result );
    }

    @Test
    public void testInjectBodyEnd()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.EDIT );
        this.portalRequest.setRawRequest( ServletRequestHolder.getRequest() );

        final List<String> list = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.BODY_END );
        assertNotNull( list );

        final String result = list.get( 0 );
        assertNotNull( result );
        assertEquals( readResource( "liveEditInjectionBodyEnd.html" ).trim() + System.lineSeparator(), result );
    }

    private void mockCurrentContextHttpRequest()
    {
        final HttpServletRequest req = Mockito.mock( HttpServletRequest.class );
        Mockito.when( req.getScheme() ).thenReturn( "http" );
        Mockito.when( req.getServerName() ).thenReturn( "localhost" );
        Mockito.when( req.getLocalPort() ).thenReturn( 80 );
        Mockito.when( req.getLocale() ).thenReturn( Locale.forLanguageTag( "no" ) );
        ServletRequestHolder.setRequest( req );
    }

    private String readResource( final String resourceName )
        throws Exception
    {
        return Resources.toString( getClass().getResource( resourceName ), Charsets.UTF_8 );
    }
}
