package com.enonic.xp.app.contentstudio;

import com.enonic.xp.portal.PortalRequest;
import com.enonic.xp.portal.PortalResponse;
import com.enonic.xp.portal.RenderMode;
import com.enonic.xp.portal.postprocess.HtmlTag;
import com.enonic.xp.portal.postprocess.PostProcessInjection;
import com.enonic.xp.util.Exceptions;
import com.google.common.collect.Maps;
import org.apache.commons.text.StringSubstitutor;
import org.osgi.service.component.annotations.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component(immediate = true, service = PostProcessInjection.class)
public final class LiveEditInjection
    implements PostProcessInjection
{
    private static final String ASSET_URL = "/admin/_/asset/com.enonic.app.contentstudio";

    private static final String PREFIX = "{{";

    private static final String SUFFIX = "}}";

    private static final char ESCAPE = '\\';

    private final String headBeginTemplate;

    private final String bodyEndTemplate;

    public LiveEditInjection()
    {
        this.headBeginTemplate = loadTemplate("liveEditHeadBegin.html");
        this.bodyEndTemplate = loadTemplate("liveEditBodyEnd.html");
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

    private String injectUsingTemplate(final String template, final Map<String, String> model)
    {
        return new StringSubstitutor(model, PREFIX, SUFFIX, ESCAPE).replace(template);
    }

    private Map<String, String> makeModelForHeadBegin( final PortalRequest portalRequest )
    {
        final Map<String, String> map = Maps.newHashMap();
        map.put("assetsUrl", portalRequest.rewriteUri(ASSET_URL));
        return map;
    }

    private Map<String, String> makeModelForBodyEnd( final PortalRequest portalRequest )
    {
        return makeModelForHeadBegin(portalRequest);
    }

    public String loadTemplate(final String name) {
        final InputStream stream = getClass().getResourceAsStream(name);

        if (stream == null) {
            throw new IllegalArgumentException("Could not find resource [" + name + "]");
        }

        try (stream) {
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (final Exception e) {
            throw Exceptions.unchecked(e);
        }
    }
}
