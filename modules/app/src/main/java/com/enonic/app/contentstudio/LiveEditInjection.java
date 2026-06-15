package com.enonic.app.contentstudio;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.apache.commons.text.StringSubstitutor;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.google.common.collect.Maps;

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
import com.enonic.xp.web.csp.ContentSecurityPolicy;
import com.enonic.xp.web.csp.CspSource;

@Component(immediate = true, service = PostProcessInjection.class)
public final class LiveEditInjection
    implements PostProcessInjection
{
    private static final String PREFIX = "{{";

    private static final String SUFFIX = "}}";

    private static final char ESCAPE = '\\';

    private final String bodyEndTemplate;

    private final PortalUrlService portalUrlService;

    private final String inlineBodyEndTemplate;

    @Activate
    public LiveEditInjection( @Reference PortalUrlService portalUrlService )
    {
        this.bodyEndTemplate = loadTemplate( "liveEditBodyEnd.html" );
        this.inlineBodyEndTemplate = loadTemplate( "liveViewBodyEnd.html" );
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
                final ContentSecurityPolicy policy = portalRequest.getContentSecurityPolicy();
                // viewer.js is a same-origin external script, so 'self' admits it - and also contains the
                // rendered page's own scripts to same-origin. Only do this because the viewer is actually
                // being injected (an error page that injects nothing gets no script-src from us). If the
                // page declared script-src-elem, that directive (not script-src) governs script elements
                // per the CSP fallback chain, so mirror 'self' into it too, otherwise the viewer is blocked.
                final boolean scriptSrcElemDeclared = policy.directive( "script-src-elem" ).isPresent();
                policy.scriptSrc( CspSource.SELF );
                if ( scriptSrcElemDeclared )
                {
                    policy.scriptSrcElem( CspSource.SELF );
                }
                final Map<String, String> model = makeModelForInjection( portalRequest );
                // 'self' admits the viewer unless the governing directive uses 'strict-dynamic', which
                // ignores 'self'/host sources. Only then does the viewer need the request nonce stamped
                // and wired into that directive (minting one if the page was hash-based) - a value that
                // exists only when it is genuinely needed, never blindly.
                final String governing = scriptSrcElemDeclared ? "script-src-elem" : "script-src";
                final boolean strictDynamic =
                    policy.directive( governing ).orElse( List.of() ).contains( CspSource.STRICT_DYNAMIC.token() );
                model.put( "nonceAttr", strictDynamic
                    ? " nonce=\"" + ( scriptSrcElemDeclared ? policy.nonceScriptSrcElem() : policy.nonceScriptSrc() ) + "\""
                    : "" );
                return Collections.singletonList( injectUsingTemplate( this.inlineBodyEndTemplate, model ) );
            }
        }
        finally
        {
            PortalRequestAccessor.remove();
        }
        return null;
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
