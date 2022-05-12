package com.enonic.xp.app.contentstudio;

import java.util.List;
import java.util.Locale;

import javax.servlet.http.HttpServletRequest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.google.common.base.Charsets;
import com.google.common.io.Resources;

import com.enonic.xp.app.contentstudio.rest.AdminRestConfig;
import com.enonic.xp.portal.PortalRequest;
import com.enonic.xp.portal.PortalResponse;
import com.enonic.xp.portal.RenderMode;
import com.enonic.xp.portal.postprocess.HtmlTag;
import com.enonic.xp.web.servlet.ServletRequestHolder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.withSettings;

@ExtendWith(MockitoExtension.class)
class LiveEditInjectionTest
{
    PortalRequest portalRequest;

    PortalResponse portalResponse;

    LiveEditInjection injection;

    @Mock(lenient = true)
    AdminRestConfig config;

    @BeforeEach
    public void setup()
    {
        this.portalRequest = new PortalRequest();
        this.portalResponse = PortalResponse.create().build();
        mockCurrentContextHttpRequest();

        this.injection = new LiveEditInjection(config);
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

    private void injectAndAssert(final String templateName)
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.EDIT );

        final List<String> list = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.HEAD_BEGIN );
        assertNotNull( list );

        final String result = list.get( 0 );
        assertNotNull( result );
        assertEquals( readResource( templateName ).trim() + System.lineSeparator(), result );
    }

    @Test
    public void testInjectHeadBegin()
        throws Exception
    {
        when( config.contentSecurityPolicy_enabled() ).thenReturn( true );
        injectAndAssert("liveEditInjectionHeadBegin.html");
    }

    @Test
    public void testInjectHeadBeginNoCsp()
        throws Exception
    {
        when( config.contentSecurityPolicy_enabled() ).thenReturn( false );

        injectAndAssert("liveEditInjectionHeadBeginNoCsp.html");
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
        final HttpServletRequest req = mock( HttpServletRequest.class, withSettings().lenient() );
        when( req.getScheme() ).thenReturn( "http" );
        when( req.getServerName() ).thenReturn( "localhost" );
        when( req.getLocalPort() ).thenReturn( 80 );
        when( req.getLocale() ).thenReturn( Locale.forLanguageTag( "no" ) );
        ServletRequestHolder.setRequest( req );
    }

    private String readResource( final String resourceName )
        throws Exception
    {
        return Resources.toString( getClass().getResource( resourceName ), Charsets.UTF_8 );
    }
}
