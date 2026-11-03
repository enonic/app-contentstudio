package com.enonic.app.contentstudio;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.text.StringSubstitutor;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.google.common.collect.Maps;
import com.google.common.net.MediaType;

import com.enonic.xp.portal.PortalRequest;
import com.enonic.xp.portal.PortalRequestAccessor;
import com.enonic.xp.portal.PortalResponse;
import com.enonic.xp.portal.RenderMode;
import com.enonic.xp.portal.postprocess.HtmlTag;
import com.enonic.xp.portal.postprocess.PostProcessInjection;
import com.enonic.xp.portal.url.AssetUrlParams;
import com.enonic.xp.portal.url.PortalUrlService;
import com.enonic.xp.project.ProjectConstants;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.util.Exceptions;
import com.enonic.xp.web.WebResponse;
import com.enonic.xp.web.csp.ContentSecurityPolicy;
import com.enonic.xp.web.csp.CspSource;

@Component(immediate = true, service = {PostProcessInjection.class, LiveEditInjection.class})
public final class LiveEditInjection
    implements PostProcessInjection
{
    private static final String PREFIX = "{{";

    private static final String SUFFIX = "}}";

    private static final char ESCAPE = '\\';

    private static final String TAG_END = "(?:[^>\"']++|\"[^\"]*\"|'[^']*')*+>";

    private static final String LEADING_SPACE = "\\s*+(?:(?:<!--.*?-->|<\\?[^>]*>)\\s*+)*+";

    private static final Pattern DOCUMENT_PREFIX =
        Pattern.compile( "\\A\\uFEFF?" + LEADING_SPACE + "(?:<!doctype\\s" + TAG_END + ")?", Pattern.CASE_INSENSITIVE | Pattern.DOTALL );

    private static final Pattern HEAD_PREFIX =
        Pattern.compile( LEADING_SPACE + "(?:<html(?=[\\s>])" + TAG_END + LEADING_SPACE + ")?<head(?=[\\s>])" + TAG_END,
                         Pattern.CASE_INSENSITIVE | Pattern.DOTALL );

    private final String bodyEndTemplate;

    private final PortalUrlService portalUrlService;

    private final String inlineBodyEndTemplate;

    private final String previewFocusTemplate;

    @Activate
    public LiveEditInjection( @Reference PortalUrlService portalUrlService )
    {
        this.bodyEndTemplate = loadTemplate( "liveEditBodyEnd.html" );
        this.inlineBodyEndTemplate = loadTemplate( "liveViewBodyEnd.html" );
        this.previewFocusTemplate = loadTemplate( "previewFocus.html" );
        this.portalUrlService = portalUrlService;
    }

    @Override
    public List<String> inject( final PortalRequest portalRequest, final PortalResponse portalResponse, final HtmlTag htmlTag )
    {
        if ( RenderMode.INLINE == portalRequest.getMode() )
        {
            return injectInlineContributions( portalRequest, htmlTag );
        }
        else if ( RenderMode.EDIT == portalRequest.getMode() )
        {
            return injectEditContributions( portalRequest, htmlTag );
        }

        return null;
    }

    public WebResponse injectPreviewFocus( final PortalRequest request, final WebResponse response )
    {
        if ( ( request.getMode() != RenderMode.INLINE && request.getMode() != RenderMode.EDIT ) || request.getEndpointPath() != null ||
            !( response.getBody() instanceof String html ) || html.isBlank() || response.getContentType() == null ||
            !response.getContentType().is( MediaType.HTML_UTF_8.withoutParameters() ) )
        {
            return response;
        }

        PortalRequestAccessor.set( request );
        try
        {
            final Map<String, String> model = makeModelForInjection( request );
            model.put( "nonceAttr", request.getMode() == RenderMode.EDIT
                ? " nonce=\"" + request.getContentSecurityPolicy().nonceScriptSrc() + "\""
                : inlineNonceAttribute( request.getContentSecurityPolicy() ) );
            final String bootstrap = injectUsingTemplate( this.previewFocusTemplate, model );
            // Insert before site scripts even when optional html/head/body tags are omitted.
            // Keep the doctype first so the bootstrap cannot switch a standards document into quirks mode.
            final Matcher prefix = DOCUMENT_PREFIX.matcher( html );
            prefix.find();
            int offset = prefix.end();
            // Preserve attributes on an explicit head; a script before it would create an implicit head instead.
            final Matcher head = HEAD_PREFIX.matcher( html ).region( offset, html.length() );
            if ( head.lookingAt() )
            {
                offset = head.end();
            }
            return WebResponse.create( response ).body( html.substring( 0, offset ) + bootstrap + html.substring( offset ) ).build();
        }
        finally
        {
            PortalRequestAccessor.remove();
        }
    }

    private List<String> injectEditContributions( final PortalRequest portalRequest, final HtmlTag htmlTag )
    {
        PortalRequestAccessor.set( portalRequest );
        try
        {
            if ( htmlTag == HtmlTag.BODY_END )
            {
                return Collections.singletonList( injectBodyEnd( portalRequest ) );
            }
        }
        finally
        {
            PortalRequestAccessor.remove();
        }
        return null;
    }

    private List<String> injectInlineContributions( final PortalRequest portalRequest, final HtmlTag htmlTag )
    {
        PortalRequestAccessor.set( portalRequest );
        try
        {
            if ( htmlTag == HtmlTag.BODY_END )
            {
                final Map<String, String> model = makeModelForInjection( portalRequest );
                model.put( "nonceAttr", inlineNonceAttribute( portalRequest.getContentSecurityPolicy() ) );
                return Collections.singletonList( injectUsingTemplate( this.inlineBodyEndTemplate, model ) );
            }
        }
        finally
        {
            PortalRequestAccessor.remove();
        }
        return null;
    }

    private String inlineNonceAttribute( final ContentSecurityPolicy policy )
    {
        // Same-origin external bootstraps need 'self' in the governing script directive.
        final boolean scriptSrcElemDeclared = policy.directive( "script-src-elem" ).isPresent();
        policy.scriptSrc( CspSource.SELF );
        if ( scriptSrcElemDeclared )
        {
            policy.scriptSrcElem( CspSource.SELF );
        }
        // strict-dynamic ignores 'self', so stamp the request nonce only when required.
        final String governing = scriptSrcElemDeclared ? "script-src-elem" : "script-src";
        final boolean strictDynamic = policy.directive( governing ).orElse( List.of() ).contains( CspSource.STRICT_DYNAMIC );
        return strictDynamic ? " nonce=\"" + ( scriptSrcElemDeclared ? policy.nonceScriptSrcElem() : policy.nonceScriptSrc() ) + "\"" : "";
    }

    private String injectBodyEnd( final PortalRequest portalRequest )
    {
        final Map<String, String> model = makeModelForInjection( portalRequest );
        // Edit mode locks script-src to 'self' plus the request nonce, so the injected editor
        // bootstrap must carry that nonce to load.
        model.put( "nonce", portalRequest.getContentSecurityPolicy().nonceScriptSrc() );
        return injectUsingTemplate( this.bodyEndTemplate, model );
    }

    private String injectUsingTemplate( final String template, final Map<String, String> model )
    {
        return new StringSubstitutor( model, PREFIX, SUFFIX, ESCAPE ).replace( template );
    }

    private Map<String, String> makeModelForInjection( final PortalRequest portalRequest )
    {
        final Map<String, String> map = Maps.newHashMap();
        final AssetUrlParams params = new AssetUrlParams();
        params.application( "com.enonic.app.contentstudio" );
        map.put( "assetsUrl", portalUrlService.assetUrl( params ) );
        map.put( "project", resolveProject( portalRequest ) );
        return map;
    }

    private String resolveProject( final PortalRequest portalRequest )
    {
        final RepositoryId repositoryId = portalRequest.getRepositoryId();
        return repositoryId != null ? repositoryId.toString().replace( ProjectConstants.PROJECT_REPO_ID_PREFIX, "" ) : "";
    }

    public String loadTemplate( final String name )
    {
        final InputStream stream = getClass().getResourceAsStream( name );

        if ( stream == null )
        {
            throw new IllegalArgumentException( "Could not find resource [" + name + "]" );
        }

        try (stream)
        {
            return new String( stream.readAllBytes(), StandardCharsets.UTF_8 );
        }
        catch ( final Exception e )
        {
            throw Exceptions.unchecked( e );
        }
    }
}
