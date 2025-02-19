package com.enonic.xp.app.contentstudio.rest.resource.content;

import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.ext.Provider;

import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.context.Context;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.node.NodePath;

@Provider
public final class CmsContentResourceFilter
    implements ContainerRequestFilter
{
    private static final Pattern PATTERN = Pattern.compile( "^" + ResourceConstants.REST_ROOT + ResourceConstants.CONTENT_CMS_PATH );

    @Override
    public void filter( final ContainerRequestContext requestContext )
        throws IOException
    {
        final Matcher matcher = PATTERN.matcher( requestContext.getUriInfo().getPath() );
        if ( matcher.find() )
        {
            final String contentRootPath = matcher.group( 2 );
            final Context context = ContextAccessor.current();
            context.getLocalScope().setAttribute( ContentConstants.BRANCH_DRAFT );
            context.getLocalScope()
                .setAttribute( "contentRootPath", NodePath.create( NodePath.ROOT ).addElement( contentRootPath ).build() );
        }
    }
}

