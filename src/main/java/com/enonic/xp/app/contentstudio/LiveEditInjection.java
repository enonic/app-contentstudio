package com.enonic.xp.app.contentstudio;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.osgi.service.component.annotations.Component;

import com.google.common.collect.Maps;

import com.enonic.xp.portal.PortalRequest;
import com.enonic.xp.portal.PortalResponse;
import com.enonic.xp.portal.RenderMode;
import com.enonic.xp.portal.postprocess.HtmlTag;
import com.enonic.xp.portal.postprocess.PostProcessInjection;
import com.enonic.xp.util.StringTemplate;

@Component(immediate = true, service = PostProcessInjection.class)
public final class LiveEditInjection
    implements PostProcessInjection
{
    private final StringTemplate headBeginTemplate;

    private final StringTemplate bodyEndTemplate;

    public LiveEditInjection()
    {
        this.headBeginTemplate = StringTemplate.load( getClass(), "liveEditHeadBegin.html" );
        this.bodyEndTemplate = StringTemplate.load( getClass(), "liveEditBodyEnd.html" );
    }

    @Override
    public List<String> inject( final PortalRequest portalRequest, final PortalResponse portalResponse, final HtmlTag htmlTag )
    {
        if ( RenderMode.EDIT != portalRequest.getMode() )
        {
            return null;
        }

        if ( htmlTag == HtmlTag.HEAD_BEGIN )
        {
            return Collections.singletonList( injectHeadBegin( portalRequest ) );
        }

        if ( htmlTag == HtmlTag.BODY_END )
        {
            return Collections.singletonList( injectBodyEnd( portalRequest ) );
        }

        return null;
    }

    private String injectHeadBegin( final PortalRequest portalRequest )
    {
        return injectUsingTemplate( this.headBeginTemplate, makeModelForHeadBegin( portalRequest ) );
    }

    private String injectBodyEnd( final PortalRequest portalRequest )
    {
        return injectUsingTemplate( this.bodyEndTemplate, makeModelForBodyEnd( portalRequest ) );
    }

    private String injectUsingTemplate( final StringTemplate template, final Map<String, String> model )
    {
        return template.apply( model ).trim() + "\n";
    }

    private Map<String, String> makeModelForHeadBegin( final PortalRequest portalRequest )
    {
        final Map<String, String> map = Maps.newHashMap();
        map.put( "assetsUrl", portalRequest.rewriteUri( "/admin/_/asset/com.enonic.app.contentstudio" ) );
        return map;
    }

    private Map<String, String> makeModelForBodyEnd( final PortalRequest portalRequest )
    {
        final Map<String, String> map = makeModelForHeadBegin( portalRequest );

        return map;
    }
}
