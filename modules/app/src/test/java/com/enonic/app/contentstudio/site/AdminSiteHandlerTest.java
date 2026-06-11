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

    private void activate( final String previewContentSecurityPolicy )
    {
        final AdminSiteConfig config = mock( AdminSiteConfig.class );
        when( config.site_preview_contentSecurityPolicy() ).thenReturn( previewContentSecurityPolicy );
        this.handler.activate( config );
    }

    private void doHandle()
        throws Exception
    {
        this.handler.doHandle( this.portalRequest, WebResponse.create().build(), this.chain );
    }

    @Test
    void editResetsScriptAndStyleWidensContentAndAddsFrameAncestors()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.EDIT );
        this.portalRequest.getContentSecurityPolicy()
            .add( "script-src", "'nonce-abc'" )
            .add( "style-src", "'sha256-xyz'" )
            .add( "img-src", "'self'" );

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().build() ).isEqualTo(
            "font-src * data:; frame-ancestors 'self'; img-src 'self' * data:; object-src 'none'" );
    }

    @Test
    void inlineAddsFrameAncestorsAndKeepsScriptAndStyle()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.INLINE );
        this.portalRequest.getContentSecurityPolicy().add( "script-src", "'nonce-abc'" );

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().build() ).isEqualTo(
            "frame-ancestors 'self'; script-src 'nonce-abc'" );
    }

    @Test
    void previewAppliesConfiguredPolicy()
        throws Exception
    {
        activate( "default-src 'self'; object-src 'none'" );
        this.portalRequest.setMode( RenderMode.PREVIEW );
        this.portalRequest.getContentSecurityPolicy().add( "script-src", "'self'" );

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().build() ).isEqualTo( "default-src 'self'; object-src 'none'" );
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
