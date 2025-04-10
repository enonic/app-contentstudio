package com.enonic.xp.app.contentstudio.rest.resource.content;

import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;

import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.context.Context;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.project.ProjectName;

@Provider
public final class CmsResourceFilter
    implements ContainerRequestFilter
{
    private static final Pattern PATTERN = Pattern.compile( "^" + ResourceConstants.REST_ROOT + ResourceConstants.CMS_PATH );

    @Override
    public void filter( final ContainerRequestContext requestContext )
        throws IOException
    {
        final Matcher matcher = PATTERN.matcher( requestContext.getUriInfo().getPath() );
        if ( matcher.find() )
        {
            final String project = matcher.group( 1 );
            final Context context = ContextAccessor.current();
            context.getLocalScope().setAttribute( ProjectName.from( project ).getRepoId() );
            context.getLocalScope().setAttribute( ContentConstants.BRANCH_DRAFT );
        }
    }
}

