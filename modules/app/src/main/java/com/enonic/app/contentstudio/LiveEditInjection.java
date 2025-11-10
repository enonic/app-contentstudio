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

import com.enonic.app.contentstudio.rest.AdminRestConfig;
import com.enonic.xp.portal.PortalRequest;
import com.enonic.xp.portal.PortalRequestAccessor;
import com.enonic.xp.portal.PortalResponse;
import com.enonic.xp.portal.RenderMode;
import com.enonic.xp.portal.postprocess.HtmlTag;
import com.enonic.xp.portal.postprocess.PostProcessInjection;
import com.enonic.xp.portal.url.AssetUrlParams;
import com.enonic.xp.portal.url.PortalUrlService;
import com.enonic.xp.util.Exceptions;

@Component(immediate = true, service = PostProcessInjection.class, configurationPid = "com.enonic.app.contentstudio")
public final class LiveEditInjection
    implements PostProcessInjection
{
    private static final String PREFIX = "{{";

    private static final String SUFFIX = "}}";

    private static final char ESCAPE = '\\';

    private final String headBeginTemplate;

    private final String bodyEndTemplate;

    private final String cspMetaTemplate;

    private final AdminRestConfig config;

    private final PortalUrlService portalUrlService;

    @Activate
    public LiveEditInjection( AdminRestConfig config, @Reference PortalUrlService portalUrlService )
    {
        this.headBeginTemplate = loadTemplate( "liveEditHeadBegin.html" );
        this.bodyEndTemplate = loadTemplate( "liveEditBodyEnd.html" );
        this.cspMetaTemplate = loadTemplate( "liveEditCSP.html" );
        this.config = config;
        this.portalUrlService = portalUrlService;
    }

    @Override
    public List<String> inject( final PortalRequest portalRequest, final PortalResponse portalResponse, final HtmlTag htmlTag )
    {
        if ( RenderMode.EDIT != portalRequest.getMode() )
        {
            return null;
        }

        PortalRequestAccessor.set( portalRequest );
        try
        {
            if ( htmlTag == HtmlTag.HEAD_BEGIN )
            {
                return Collections.singletonList( injectHeadBegin() );
            }

            if ( htmlTag == HtmlTag.BODY_END )
            {
                return Collections.singletonList( injectBodyEnd() );
            }
        }
        finally
        {
            PortalRequestAccessor.remove();
        }

        return null;
    }

    private String injectHeadBegin()
    {
        String finalTemplate = "";
        if ( this.config.contentSecurityPolicy_enabled() )
        {
            finalTemplate += this.cspMetaTemplate;
        }
        finalTemplate += injectUsingTemplate( this.headBeginTemplate, makeModelForHeadBegin() );
        return finalTemplate;
    }

    private String injectBodyEnd()
    {
        return injectUsingTemplate( this.bodyEndTemplate, makeModelForBodyEnd() );
    }

    private String injectUsingTemplate( final String template, final Map<String, String> model )
    {
        return new StringSubstitutor( model, PREFIX, SUFFIX, ESCAPE ).replace( template );
    }

    private Map<String, String> makeModelForHeadBegin()
    {
        final Map<String, String> map = Maps.newHashMap();
        final AssetUrlParams params = new AssetUrlParams();
        params.application( "com.enonic.app.contentstudio" );
        map.put( "assetsUrl", portalUrlService.assetUrl( params ) );
        return map;
    }

    private Map<String, String> makeModelForBodyEnd()
    {
        return makeModelForHeadBegin();
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
