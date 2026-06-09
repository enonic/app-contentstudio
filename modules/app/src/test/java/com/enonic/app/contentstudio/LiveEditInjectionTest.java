package com.enonic.app.contentstudio;

import java.util.List;
import java.util.Locale;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import com.google.common.base.Charsets;
import com.google.common.io.Resources;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.app.contentstudio.rest.AdminRestConfig;
import com.enonic.xp.portal.PortalRequest;
import com.enonic.xp.portal.PortalResponse;
import com.enonic.xp.portal.RenderMode;
import com.enonic.xp.portal.postprocess.HtmlTag;
import com.enonic.xp.portal.url.AssetUrlParams;
import com.enonic.xp.portal.url.PortalUrlService;
import com.enonic.xp.project.ProjectName;

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

    PortalUrlService portalUrlService;

    private HttpServletRequest request;

    @Mock(lenient = true)
    AdminRestConfig config;

    @BeforeEach
    public void setup()
    {
        this.portalRequest = new PortalRequest();
        this.portalResponse = PortalResponse.create().build();
        this.request = mockCurrentContextHttpRequest();

        this.portalUrlService = mock( PortalUrlService.class );
        this.injection = new LiveEditInjection( config, portalUrlService );
    }

    @Test
    public void testNoInjection()
    {
        this.portalRequest.setMode( RenderMode.EDIT );

        final List<String> result1 = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.HEAD_END );
        assertNull( result1 );

        final List<String> result2 = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.BODY_BEGIN );
        assertNull( result2 );

        final List<String> result3 = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.HEAD_BEGIN );
        assertNull( result3 );

        this.portalRequest.setMode( RenderMode.LIVE );

        final List<String> result4 = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.BODY_END );
        assertNull( result4 );
    }

    @Test
    public void testInjectBodyEnd()
        throws Exception
    {
        mockPortalUrlService();
        this.portalRequest.setMode( RenderMode.EDIT );
        this.portalRequest.setRawRequest( this.request );
        this.portalRequest.setRepositoryId( ProjectName.from( "myproject" ).getRepoId() );

        final List<String> list = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.BODY_END );
        assertNotNull( list );

        final String result = list.get( 0 );
        assertNotNull( result );
        assertEquals( readResource( "liveEditInjectionBodyEnd.html" ).trim(), result.trim() );
    }

    @Test
    public void testEditModeUnionsCspAndOverridesScriptAndStyle()
        throws Exception
    {
        mockPortalUrlService();
        when( config.contentSecurityPolicy_enabled() ).thenReturn( true );
        this.portalRequest.setMode( RenderMode.EDIT );
        this.portalRequest.setRawRequest( this.request );
        this.portalRequest.setRepositoryId( ProjectName.from( "myproject" ).getRepoId() );

        // the page hardened its policy during rendering
        this.portalRequest.getContentSecurityPolicy()
            .add( "script-src", "'nonce-abc'" )
            .add( "frame-ancestors", "'none'" )
            .add( "img-src", "https://cdn.example.com" );

        this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.BODY_END );

        final String policy = this.portalRequest.getContentSecurityPolicy().build();
        // overridden: the page's nonce is dropped so the editor's inline scripts/styles work
        assertEquals( true, policy.contains( "script-src 'self' 'unsafe-inline'" ), policy );
        assertEquals( true, policy.contains( "style-src * 'unsafe-inline'" ), policy );
        // unioned: 'none' yields to the editor frame, other page sources are kept
        assertEquals( true, policy.contains( "frame-ancestors 'self'" ), policy );
        assertEquals( true, policy.contains( "img-src https://cdn.example.com * data:" ), policy );
        assertEquals( true, policy.contains( "default-src 'self'" ), policy );
    }

    @Test
    public void testEditModeLeavesCspAloneWhenDisabled()
        throws Exception
    {
        mockPortalUrlService();
        when( config.contentSecurityPolicy_enabled() ).thenReturn( false );
        this.portalRequest.setMode( RenderMode.EDIT );
        this.portalRequest.setRawRequest( this.request );
        this.portalRequest.setRepositoryId( ProjectName.from( "myproject" ).getRepoId() );

        this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.BODY_END );

        assertEquals( "", this.portalRequest.getContentSecurityPolicy().build() );
    }

    private HttpServletRequest mockCurrentContextHttpRequest()
    {
        final HttpServletRequest req = mock( HttpServletRequest.class, withSettings().lenient() );

        when( req.getScheme() ).thenReturn( "http" );
        when( req.getServerName() ).thenReturn( "localhost" );
        when( req.getLocalPort() ).thenReturn( 80 );
        when( req.getLocale() ).thenReturn( Locale.forLanguageTag( "no" ) );

        return req;
    }

    private String readResource( final String resourceName )
        throws Exception
    {
        return Resources.toString( getClass().getResource( resourceName ), Charsets.UTF_8 );
    }

    private void mockPortalUrlService() {
        when( portalUrlService.assetUrl( Mockito.any( AssetUrlParams.class ) ) ).thenReturn( "/_/asset/com.enonic.app.contentstudio" );
    }
}
