package com.enonic.app.contentstudio.site;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.xp.content.ContentService;
import com.enonic.xp.portal.PortalRequest;
import com.enonic.xp.portal.RenderMode;
import com.enonic.xp.project.ProjectService;
import com.enonic.xp.web.HttpStatus;
import com.enonic.xp.web.WebResponse;
import com.enonic.xp.web.exception.ExceptionMapper;
import com.enonic.xp.web.exception.ExceptionRenderer;
import com.enonic.xp.web.handler.WebHandlerChain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminSiteHandlerTest
{
    private AdminSiteHandler handler;

    private PortalRequest portalRequest;

    private WebHandlerChain chain;

    @BeforeEach
    void setUp()
        throws Exception
    {
        this.handler = new AdminSiteHandler( mock( ContentService.class ), mock( ProjectService.class ), mock( ExceptionMapper.class ),
                                             mock( ExceptionRenderer.class ) );
        activate( "" );

        final Map<String, Object> attributes = new HashMap<>();
        final HttpServletRequest rawRequest = mock( HttpServletRequest.class );
        doAnswer( inv -> attributes.put( inv.getArgument( 0 ), inv.getArgument( 1 ) ) ).when( rawRequest )
            .setAttribute( any(), any() );
        when( rawRequest.getAttribute( any() ) ).thenAnswer( inv -> attributes.get( inv.getArgument( 0 ) ) );

        this.portalRequest = new PortalRequest();
        this.portalRequest.setRawRequest( rawRequest );

        this.chain = mock( WebHandlerChain.class );
        when( this.chain.handle( any(), any() ) ).thenReturn( WebResponse.create().build() );
    }

    private void activate( final String contentSecurityPolicy )
    {
        final AdminSiteConfig config = mock( AdminSiteConfig.class );
        when( config.site_inline_contentSecurityPolicy() ).thenReturn( contentSecurityPolicy );
        when( config.site_preview_contentSecurityPolicy() ).thenReturn( contentSecurityPolicy );
        this.handler.activate( config );
    }

    private void doHandle()
        throws Exception
    {
        this.handler.doHandle( this.portalRequest, WebResponse.create().build(), this.chain );
    }

    @Test
    void editReplacesScriptAndStyleWidensContentAndAddsFrameAncestors()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.EDIT );
        final String nonce = this.portalRequest.getContentSecurityPolicy().nonceScriptSrc();
        this.portalRequest.getContentSecurityPolicy()
            .add( "style-src", "'sha256-xyz'" )
            .add( "img-src", "'self'" );

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().build() ).isEqualTo(
            "connect-src 'self'; font-src * data:; frame-ancestors 'self'; frame-src *; img-src 'self' * data:; media-src *; " +
                "object-src 'none'; script-src 'self' 'nonce-" + nonce + "'; style-src * 'unsafe-inline'" );
    }

    @Test
    void editKeepsTheEditorWorkingUnderAStrictAppPolicy()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.EDIT );
        this.portalRequest.getContentSecurityPolicy().strict();

        doHandle();

        final String nonce = this.portalRequest.getContentSecurityPolicy().nonceScriptSrc();
        assertThat( this.portalRequest.getContentSecurityPolicy().build() ).isEqualTo(
            "base-uri 'none'; connect-src 'self'; default-src 'none'; font-src * data:; frame-ancestors 'self'; frame-src *; " +
                "img-src * data:; media-src *; object-src 'none'; script-src 'self' 'nonce-" + nonce + "'; " +
                "style-src * 'unsafe-inline'" );
    }

    @Test
    void inlineAddsFrameAncestorsAndDoesNotTouchScriptSrc()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.INLINE );

        doHandle();

        // script-src 'self' is added by LiveEditInjection when the viewer is injected, not here
        assertThat( this.portalRequest.getContentSecurityPolicy().build() ).isEqualTo( "frame-ancestors 'self'" );
    }

    @Test
    void inlineKeepsTheSitesOwnScriptSrc()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.INLINE );
        this.portalRequest.getContentSecurityPolicy().add( "script-src", "'self'" );

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().build() ).isEqualTo(
            "frame-ancestors 'self'; script-src 'self'" );
    }

    @Test
    void inlineGapFillsTheContainmentBaseline()
        throws Exception
    {
        activate( "connect-src 'self'; object-src 'none'" );
        this.portalRequest.setMode( RenderMode.INLINE );

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().build() ).isEqualTo(
            "connect-src 'self'; frame-ancestors 'self'; object-src 'none'" );
    }

    @Test
    void inlinePreservesPageDeclaredDirectivesAndFillsGaps()
        throws Exception
    {
        activate( "connect-src 'self'; form-action 'self'; base-uri 'self'; object-src 'none'" );
        this.portalRequest.setMode( RenderMode.INLINE );
        this.portalRequest.getContentSecurityPolicy().add( "script-src", "'self'", "https://cdn.example.com" );

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().build() ).isEqualTo(
            "base-uri 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'; " +
                "script-src 'self' https://cdn.example.com" );
    }

    @Test
    void inlineErrorPageStaysFramableWithoutScriptSrc()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.INLINE );
        when( this.chain.handle( any(), any() ) ).thenReturn( WebResponse.create().status( HttpStatus.NOT_FOUND ).build() );

        doHandle();

        // no viewer is injected on an error page, so no script-src is added
        assertThat( this.portalRequest.getContentSecurityPolicy().build() ).isEqualTo( "frame-ancestors 'self'" );
    }

    @Test
    void previewGapFillsBaselineKeepingPageScriptSrc()
        throws Exception
    {
        activate( "default-src 'self'; object-src 'none'" );
        this.portalRequest.setMode( RenderMode.PREVIEW );
        this.portalRequest.getContentSecurityPolicy().add( "script-src", "'self'" );

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().build() ).isEqualTo(
            "default-src 'self'; object-src 'none'; script-src 'self'" );
    }

    @Test
    void previewKeepsThePageNonceAndSkipsTheBaselineScriptSrc()
        throws Exception
    {
        activate( "script-src 'self'" );
        this.portalRequest.setMode( RenderMode.PREVIEW );
        final String nonce = this.portalRequest.getContentSecurityPolicy().nonceScriptSrc();

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().build() ).isEqualTo( "script-src 'nonce-" + nonce + "'" );
    }

    @Test
    void previewLeavesAGoodAppsStrictScriptSrcUntouched()
        throws Exception
    {
        activate( "script-src 'self'" );
        this.portalRequest.setMode( RenderMode.PREVIEW );
        this.portalRequest.getContentSecurityPolicy().add( "script-src", "'none'" );

        doHandle();

        // preview injects nothing, so it must not loosen the page's own 'none'
        assertThat( this.portalRequest.getContentSecurityPolicy().build() ).isEqualTo( "script-src 'none'" );
    }

    @Test
    void previewWithBlankConfigLeavesPolicyAlone()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.PREVIEW );
        this.portalRequest.getContentSecurityPolicy().add( "script-src", "'self'" );

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().build() ).isEqualTo( "script-src 'self'" );
    }

    @Test
    void adminModeLeavesPolicyAlone()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.ADMIN );
        this.portalRequest.getContentSecurityPolicy().add( "script-src", "'self'" );

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().build() ).isEqualTo( "script-src 'self'" );
    }
}
