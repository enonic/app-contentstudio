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
import com.google.common.net.MediaType;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.xp.portal.PortalRequest;
import com.enonic.xp.portal.PortalResponse;
import com.enonic.xp.portal.RenderMode;
import com.enonic.xp.portal.postprocess.HtmlTag;
import com.enonic.xp.portal.url.AssetUrlParams;
import com.enonic.xp.portal.url.PortalUrlService;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.web.WebResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
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

    @BeforeEach
    public void setup()
    {
        this.portalRequest = new PortalRequest();
        this.portalResponse = PortalResponse.create().build();
        this.request = mockCurrentContextHttpRequest();

        this.portalUrlService = mock( PortalUrlService.class );
        this.injection = new LiveEditInjection( portalUrlService );
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
        final String nonce = this.portalRequest.getContentSecurityPolicy().nonceScriptSrc();
        assertEquals( readResource( "liveEditInjectionBodyEnd.html" ).trim().replace( "{{nonce}}", nonce ), result.trim() );
    }

    @Test
    public void testInjectInlineBodyEndAddsScriptSrcSelfForTheViewer()
    {
        mockPortalUrlService();
        this.portalRequest.setMode( RenderMode.INLINE );
        this.portalRequest.setRawRequest( this.request );
        this.portalRequest.setRepositoryId( ProjectName.from( "myproject" ).getRepoId() );

        final List<String> list = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.BODY_END );
        assertNotNull( list );

        final String result = list.get( 0 );
        assertFalse( result.contains( "nonce" ) );
        assertEquals( "script-src 'self'", this.portalRequest.getContentSecurityPolicy().serialize() );
    }

    @Test
    public void testInjectInlineBodyEndForcesScriptSrcSelfOverAStrictPage()
    {
        mockPortalUrlService();
        this.portalRequest.setMode( RenderMode.INLINE );
        this.portalRequest.setRawRequest( this.request );
        this.portalRequest.setRepositoryId( ProjectName.from( "myproject" ).getRepoId() );
        this.portalRequest.getContentSecurityPolicy().add( "script-src", "'none'" );

        this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.BODY_END );

        // the injected viewer must run even over a page that declared script-src 'none'
        assertEquals( "script-src 'self'", this.portalRequest.getContentSecurityPolicy().serialize() );
    }

    @Test
    public void testInjectInlineBodyEndDoesNotStampANonceForANonceOnlyPage()
    {
        mockPortalUrlService();
        this.portalRequest.setMode( RenderMode.INLINE );
        this.portalRequest.setRawRequest( this.request );
        this.portalRequest.setRepositoryId( ProjectName.from( "myproject" ).getRepoId() );
        // a nonce without 'strict-dynamic' does not defeat 'self', which already admits the same-origin
        // viewer, so no nonce is stamped on it
        this.portalRequest.getContentSecurityPolicy().nonceScriptSrc();

        final List<String> list = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.BODY_END );
        assertNotNull( list );
        assertFalse( list.get( 0 ).contains( "nonce" ) );
    }

    @Test
    public void testInjectInlineBodyEndStampsThePageNonceUnderStrictDynamic()
    {
        mockPortalUrlService();
        this.portalRequest.setMode( RenderMode.INLINE );
        this.portalRequest.setRawRequest( this.request );
        this.portalRequest.setRepositoryId( ProjectName.from( "myproject" ).getRepoId() );
        final String nonce = this.portalRequest.getContentSecurityPolicy().nonceScriptSrc();
        this.portalRequest.getContentSecurityPolicy().add( "script-src", "'strict-dynamic'" );

        final List<String> list = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.BODY_END );
        assertNotNull( list );
        // 'strict-dynamic' ignores 'self', so the viewer must carry the page's nonce to load
        assertTrue( list.get( 0 ).contains( " nonce=\"" + nonce + "\"" ) );
    }

    @Test
    public void testInjectInlineBodyEndMintsANonceForAHashBasedStrictPage()
    {
        mockPortalUrlService();
        this.portalRequest.setMode( RenderMode.INLINE );
        this.portalRequest.setRawRequest( this.request );
        this.portalRequest.setRepositoryId( ProjectName.from( "myproject" ).getRepoId() );
        // a hash-based 'strict-dynamic' page has no nonce of its own and ignores 'self'
        this.portalRequest.getContentSecurityPolicy().add( "script-src", "'strict-dynamic'", "'sha256-abc'" );

        final List<String> list = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.BODY_END );
        assertNotNull( list );
        final String nonce = this.portalRequest.getContentSecurityPolicy().nonceScriptSrc();
        assertTrue( list.get( 0 ).contains( " nonce=\"" + nonce + "\"" ) );
        assertTrue( this.portalRequest.getContentSecurityPolicy().serialize().contains( "'nonce-" + nonce + "'" ) );
    }

    @Test
    public void testInjectInlineBodyEndMirrorsSelfIntoADeclaredScriptSrcElem()
    {
        mockPortalUrlService();
        this.portalRequest.setMode( RenderMode.INLINE );
        this.portalRequest.setRawRequest( this.request );
        this.portalRequest.setRepositoryId( ProjectName.from( "myproject" ).getRepoId() );
        this.portalRequest.getContentSecurityPolicy().add( "script-src-elem", "https://cdn.example.com" );

        final List<String> list = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.BODY_END );
        assertNotNull( list );
        assertFalse( list.get( 0 ).contains( "nonce" ) );
        // script-src-elem governs script elements, so 'self' is mirrored into it for the viewer
        assertEquals( "script-src 'self'; script-src-elem https://cdn.example.com 'self'",
                      this.portalRequest.getContentSecurityPolicy().serialize() );
    }

    @Test
    public void testInjectInlineBodyEndWiresNonceIntoScriptSrcElemUnderStrictDynamic()
    {
        mockPortalUrlService();
        this.portalRequest.setMode( RenderMode.INLINE );
        this.portalRequest.setRawRequest( this.request );
        this.portalRequest.setRepositoryId( ProjectName.from( "myproject" ).getRepoId() );
        this.portalRequest.getContentSecurityPolicy().add( "script-src-elem", "'strict-dynamic'", "'sha256-abc'" );

        final List<String> list = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.BODY_END );
        assertNotNull( list );
        final String nonce = this.portalRequest.getContentSecurityPolicy().nonceScriptSrcElem();
        assertTrue( list.get( 0 ).contains( " nonce=\"" + nonce + "\"" ) );
        assertTrue( this.portalRequest.getContentSecurityPolicy().serialize().contains( "'nonce-" + nonce + "'" ) );
    }

    @Test
    public void testInjectStartupGuardBeforeSiteScriptsInBrowseAndWizard()
    {
        mockPortalUrlService();
        this.portalRequest.setRawRequest( this.request );

        for ( final RenderMode mode : List.of( RenderMode.INLINE, RenderMode.EDIT ) )
        {
            this.portalRequest.setMode( mode );
            final WebResponse result = this.injection.injectPreviewFocus( this.portalRequest, htmlResponse(
                "<!doctype html><html><head><script src=\"/site.js\"></script></head><body></body></html>" ) );
            final String body = (String) result.getBody();

            assertTrue( body.startsWith( "<!doctype html><html><head><script " ) );
            assertTrue( body.contains( "src=\"/_/asset/com.enonic.app.contentstudio/page-editor/js/preview-focus.js\"" ) );
            assertTrue( body.indexOf( "preview-focus.js" ) < body.indexOf( "/site.js" ) );
            assertFalse( body.contains( "defer" ) );
            assertFalse( body.contains( "async" ) );
        }
    }

    @Test
    public void testStartupGuardSharesTheEditorsNonce()
    {
        mockPortalUrlService();
        this.portalRequest.setRawRequest( this.request );
        this.portalRequest.setMode( RenderMode.EDIT );

        final String head = (String) this.injection.injectPreviewFocus( this.portalRequest, htmlResponse( "<input autofocus>" ) ).getBody();
        final String body = this.injection.inject( this.portalRequest, this.portalResponse, HtmlTag.BODY_END ).get( 0 );
        final String nonce = this.portalRequest.getContentSecurityPolicy().nonceScriptSrc();

        assertTrue( head.contains( " nonce=\"" + nonce + "\"" ) );
        assertTrue( body.contains( " nonce=\"" + nonce + "\"" ) );
        assertTrue( body.contains( "/page-editor/js/editor.js" ) );
    }

    @Test
    public void testStartupGuardUsesTheInlineScriptSrcElemNonce()
    {
        mockPortalUrlService();
        this.portalRequest.setRawRequest( this.request );
        this.portalRequest.setMode( RenderMode.INLINE );
        this.portalRequest.getContentSecurityPolicy().add( "script-src-elem", "'strict-dynamic'", "'sha256-abc'" );

        final String head = (String) this.injection.injectPreviewFocus( this.portalRequest, htmlResponse( "<input autofocus>" ) ).getBody();
        final String nonce = this.portalRequest.getContentSecurityPolicy().nonceScriptSrcElem();

        assertTrue( head.contains( " nonce=\"" + nonce + "\"" ) );
        assertTrue( this.portalRequest.getContentSecurityPolicy().serialize().contains( "'nonce-" + nonce + "'" ) );
    }

    @Test
    public void testStartupGuardHandlesImplicitHeadAndBodyTags()
    {
        mockPortalUrlService();
        this.portalRequest.setRawRequest( this.request );
        for ( final RenderMode mode : List.of( RenderMode.INLINE, RenderMode.EDIT ) )
        {
            this.portalRequest.setMode( mode );
            for ( final String html : List.of( "<!doctype html><html><body><input autofocus></body></html>",
                                               "<!doctype html><script src=\"/site.js\"></script><input autofocus>",
                                               "<script src=\"/site.js\"></script><input autofocus>" ) )
            {
                final String body = (String) this.injection.injectPreviewFocus( this.portalRequest, htmlResponse( html ) ).getBody();
                assertTrue( body.indexOf( "preview-focus.js" ) < body.indexOf( "<input" ) );
                if ( html.contains( "/site.js" ) )
                {
                    assertTrue( body.indexOf( "preview-focus.js" ) < body.indexOf( "/site.js" ) );
                }
                if ( html.startsWith( "<!doctype" ) )
                {
                    assertTrue( body.startsWith( "<!doctype html><script " ) );
                }
            }
        }
    }

    @Test
    public void testStartupGuardPreservesDocumentPrefixesAndQuotedDoctypes()
    {
        mockPortalUrlService();
        this.portalRequest.setRawRequest( this.request );
        this.portalRequest.setMode( RenderMode.INLINE );
        final String prefix = "\uFEFF  <!-- <!doctype fake> -->\n<!DOCTYPE html PUBLIC \"quoted > value\" \"\">";

        final String body = (String) this.injection.injectPreviewFocus( this.portalRequest, htmlResponse(
            prefix + "<html><body><input autofocus></body></html>" ) ).getBody();

        assertTrue( body.startsWith( prefix + "<script " ) );
    }

    @Test
    public void testStartupGuardPreservesExplicitHeadAttributes()
    {
        mockPortalUrlService();
        this.portalRequest.setRawRequest( this.request );
        this.portalRequest.setMode( RenderMode.INLINE );
        for ( final String prefix : List.of( "<!doctype html><html lang=\"en\"><head id=\"site-head\" data-config=\">\">",
                                             "<!-- head comment --><head id=\"site-head\">",
                                             "<!DOCTYPE html>\n<!-- comment --><HTML lang='en'>\n<HEAD id='site-head'>" ) )
        {
            final String body = (String) this.injection.injectPreviewFocus( this.portalRequest, htmlResponse(
                prefix + "<script src=\"/site.js\"></script></head><body><input autofocus></body>" ) ).getBody();

            assertTrue( body.startsWith( prefix + "<script " ) );
        }
    }

    @Test
    public void testStartupGuardSkipsProcessingInstructionsBeforeTheDoctypeAndHead()
    {
        mockPortalUrlService();
        this.portalRequest.setRawRequest( this.request );
        for ( final RenderMode mode : List.of( RenderMode.INLINE, RenderMode.EDIT ) )
        {
            this.portalRequest.setMode( mode );
            for ( final String prefix : List.of( "<?xml version=\"1.0\"?><!doctype html>",
                                                 "\uFEFF \n<!-- comment --><?xml version=\"1.0\"?>\n<?custom data?><!doctype html>",
                                                 "<?xml version=\"1.0\"?><!doctype html><?after-doctype data>" ) )
            {
                final String head = "<html lang=\"en\"><head id=\"site-head\">";
                final String body = (String) this.injection.injectPreviewFocus( this.portalRequest, htmlResponse(
                    prefix + head + "<script src=\"/site.js\"></script></head><body><input autofocus></body></html>" ) ).getBody();

                assertTrue( body.startsWith( prefix + head + "<script " ) );
                assertTrue( body.indexOf( "preview-focus.js" ) < body.indexOf( "/site.js" ) );
            }
        }
    }

    @Test
    public void testStartupGuardSkipsStandalonePreviewsAndNonHtmlResponses()
    {
        final WebResponse html = htmlResponse( "<input autofocus>" );
        this.portalRequest.setMode( RenderMode.PREVIEW );
        assertEquals( html, this.injection.injectPreviewFocus( this.portalRequest, html ) );

        this.portalRequest.setMode( RenderMode.INLINE );
        for ( final WebResponse response : List.of( WebResponse.create().build(), WebResponse.create()
            .contentType( MediaType.PLAIN_TEXT_UTF_8 )
            .body( "<input autofocus>" )
            .build(), WebResponse.create().contentType( MediaType.HTML_UTF_8 ).body( new byte[]{1, 2} ).build(), htmlResponse( "" ) ) )
        {
            assertEquals( response, this.injection.injectPreviewFocus( this.portalRequest, response ) );
        }
        this.portalRequest.setRawPath( "/site/_/component/main/0" );
        assertEquals( html, this.injection.injectPreviewFocus( this.portalRequest, html ) );
    }

    private WebResponse htmlResponse( final String html )
    {
        return WebResponse.create().contentType( MediaType.HTML_UTF_8 ).body( html ).build();
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
