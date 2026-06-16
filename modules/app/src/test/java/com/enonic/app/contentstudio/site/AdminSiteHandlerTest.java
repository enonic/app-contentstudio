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
import com.enonic.xp.web.csp.ContentSecurityPolicy;
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

        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo(
            "connect-src 'self'; font-src * data:; frame-ancestors 'self'; img-src 'self' * data:; " +
                "object-src 'none'; sandbox allow-scripts allow-same-origin; script-src 'self' 'nonce-" + nonce +
                "'; style-src * 'unsafe-inline'" );
    }

    @Test
    void editKeepsTheEditorWorkingUnderAStrictAppPolicy()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.EDIT );
        this.portalRequest.getContentSecurityPolicy().strict();

        doHandle();

        final String nonce = this.portalRequest.getContentSecurityPolicy().nonceScriptSrc();
        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo(
            "base-uri 'none'; connect-src 'self'; default-src 'none'; font-src * data:; frame-ancestors 'self'; " +
                "img-src * data:; object-src 'none'; sandbox allow-scripts allow-same-origin; " +
                "script-src 'self' 'nonce-" + nonce + "'; style-src * 'unsafe-inline'" );
    }

    @Test
    void editResetsGranularScriptAndStyleDirectivesSoTheForcedPolicyGoverns()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.EDIT );
        // a page-declared script-src-elem/style-src-elem would otherwise shadow the forced
        // script-src/style-src for elements and could block editor.js or its inline styles
        this.portalRequest.getContentSecurityPolicy()
            .add( "script-src-elem", "'none'" )
            .add( "style-src-elem", "'none'" );

        doHandle();

        final String nonce = this.portalRequest.getContentSecurityPolicy().nonceScriptSrc();
        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo(
            "connect-src 'self'; font-src * data:; frame-ancestors 'self'; img-src * data:; object-src 'none'; " +
                "sandbox allow-scripts allow-same-origin; script-src 'self' 'nonce-" + nonce +
                "'; style-src * 'unsafe-inline'" );
    }

    @Test
    void editLeavesFrameSrcAndMediaSrcToThePage()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.EDIT );
        this.portalRequest.getContentSecurityPolicy()
            .add( "frame-src", "'self'" )
            .add( "media-src", "'self'" );

        doHandle();

        final String nonce = this.portalRequest.getContentSecurityPolicy().nonceScriptSrc();
        // the editor has no frame-src/media-src dependency, so the page's own values are kept untouched
        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo(
            "connect-src 'self'; font-src * data:; frame-ancestors 'self'; frame-src 'self'; img-src * data:; " +
                "media-src 'self'; object-src 'none'; sandbox allow-scripts allow-same-origin; script-src 'self' 'nonce-" +
                nonce + "'; style-src * 'unsafe-inline'" );
    }

    @Test
    void inlineAddsFrameAncestorsAndDoesNotTouchScriptSrc()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.INLINE );

        doHandle();

        // script-src 'self' is added by LiveEditInjection when the viewer is injected, not here
        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo(
            "frame-ancestors 'self'; sandbox allow-scripts allow-same-origin" );
    }

    @Test
    void inlineKeepsTheSitesOwnScriptSrc()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.INLINE );
        this.portalRequest.getContentSecurityPolicy().add( "script-src", "'self'" );

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo(
            "frame-ancestors 'self'; sandbox allow-scripts allow-same-origin; script-src 'self'" );
    }

    @Test
    void inlineGapFillsTheContainmentBaseline()
        throws Exception
    {
        activate( "connect-src 'self'; object-src 'none'" );
        this.portalRequest.setMode( RenderMode.INLINE );

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo(
            "connect-src 'self'; frame-ancestors 'self'; object-src 'none'; sandbox allow-scripts allow-same-origin" );
    }

    @Test
    void inlineFallsBackToPreviewBaselineWhenInlineUnset()
        throws Exception
    {
        final AdminSiteConfig config = mock( AdminSiteConfig.class );
        when( config.site_inline_contentSecurityPolicy() ).thenReturn( "" );
        when( config.site_preview_contentSecurityPolicy() ).thenReturn( "connect-src 'self'; worker-src 'self'" );
        this.handler.activate( config );

        this.portalRequest.setMode( RenderMode.INLINE );

        doHandle();

        // inline has no baseline of its own, so it gap-fills the preview baseline (incl. worker-src)
        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo(
            "connect-src 'self'; frame-ancestors 'self'; sandbox allow-scripts allow-same-origin; worker-src 'self'" );
    }

    @Test
    void inlineImposesItsSandboxDroppingPageGrantedCapabilities()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.INLINE );
        this.portalRequest.getContentSecurityPolicy().add( "sandbox", "allow-forms", "allow-popups" );

        doHandle();

        // a page-declared sandbox is replaced, not extended: its extra grants are dropped
        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo(
            "frame-ancestors 'self'; sandbox allow-scripts allow-same-origin" );
    }

    @Test
    void inlinePreservesPageDeclaredDirectivesAndFillsGaps()
        throws Exception
    {
        activate( "connect-src 'self'; form-action 'self'; base-uri 'self'; object-src 'none'" );
        this.portalRequest.setMode( RenderMode.INLINE );
        this.portalRequest.getContentSecurityPolicy().add( "script-src", "'self'", "https://cdn.example.com" );

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo(
            "base-uri 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'; " +
                "sandbox allow-scripts allow-same-origin; script-src 'self' https://cdn.example.com" );
    }

    @Test
    void inlineErrorPageStaysFramableWithoutScriptSrc()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.INLINE );
        when( this.chain.handle( any(), any() ) ).thenReturn( WebResponse.create().status( HttpStatus.NOT_FOUND ).build() );

        doHandle();

        // no viewer is injected on an error page, so no script-src is added
        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo(
            "frame-ancestors 'self'; sandbox allow-scripts allow-same-origin" );
    }

    @Test
    void previewGapFillsBaselineKeepingPageScriptSrc()
        throws Exception
    {
        activate( "default-src 'self'; object-src 'none'" );
        this.portalRequest.setMode( RenderMode.PREVIEW );
        this.portalRequest.getContentSecurityPolicy().add( "script-src", "'self'" );

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo(
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

        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo( "script-src 'nonce-" + nonce + "'" );
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
        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo( "script-src 'none'" );
    }

    @Test
    void previewWithBlankConfigLeavesPolicyAlone()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.PREVIEW );
        this.portalRequest.getContentSecurityPolicy().add( "script-src", "'self'" );

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo( "script-src 'self'" );
    }

    @Test
    void adminModeLeavesPolicyAlone()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.ADMIN );
        this.portalRequest.getContentSecurityPolicy().add( "script-src", "'self'" );

        doHandle();

        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo( "script-src 'self'" );
    }

    @Test
    void editDropsAContentContributedAdditionalEnforcedPolicy()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.EDIT );
        // an additional enforced policy AND-restricts independently - a 'script-src none' here would
        // block editor.js no matter what the forced main policy allows, so it must be dropped
        this.portalRequest.getContentSecurityPolicy().addPolicy().add( "script-src", "'none'" );

        doHandle();

        final String nonce = this.portalRequest.getContentSecurityPolicy().nonceScriptSrc();
        assertThat( this.portalRequest.getContentSecurityPolicy().serialize() ).isEqualTo(
            "connect-src 'self'; font-src * data:; frame-ancestors 'self'; img-src * data:; object-src 'none'; " +
                "sandbox allow-scripts allow-same-origin; script-src 'self' 'nonce-" + nonce +
                "'; style-src * 'unsafe-inline'" );
    }

    @Test
    void editClearsAContentContributedReportOnlyRuleSet()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.EDIT );
        this.portalRequest.getContentSecurityPolicy().reportOnly().add( "script-src", "'unsafe-inline'" );

        doHandle();

        // the page's report-only must not ride onto the admin-origin response
        assertThat( this.portalRequest.getContentSecurityPolicy().reportOnly().serialize() ).isEmpty();
    }

    @Test
    void inlineDropsContentContributedAdditionalAndReportOnlyPolicies()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.INLINE );
        final ContentSecurityPolicy policy = this.portalRequest.getContentSecurityPolicy();
        policy.addPolicy().add( "script-src", "'none'" );
        policy.reportOnly().add( "img-src", "'self'" );

        doHandle();

        assertThat( policy.serialize() ).isEqualTo( "frame-ancestors 'self'; sandbox allow-scripts allow-same-origin" );
        assertThat( policy.reportOnly().serialize() ).isEmpty();
    }

    @Test
    void previewKeepsContentContributedAdditionalAndReportOnlyPolicies()
        throws Exception
    {
        this.portalRequest.setMode( RenderMode.PREVIEW );
        final ContentSecurityPolicy policy = this.portalRequest.getContentSecurityPolicy();
        policy.add( "script-src", "'self'" );
        policy.addPolicy().add( "object-src", "'none'" );
        policy.reportOnly().add( "img-src", "'self'" );

        doHandle();

        // preview injects nothing and reflects the page as served, so it takes nothing over
        assertThat( policy.serialize() ).isEqualTo( "script-src 'self', object-src 'none'" );
        assertThat( policy.reportOnly().serialize() ).isEqualTo( "img-src 'self'" );
    }
}
