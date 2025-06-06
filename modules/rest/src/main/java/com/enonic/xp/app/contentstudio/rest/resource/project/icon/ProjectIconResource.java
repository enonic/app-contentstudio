package com.enonic.xp.app.contentstudio.rest.resource.project.icon;

import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.CacheControl;
import jakarta.ws.rs.core.Response;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.google.common.io.ByteSource;

import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.app.contentstudio.rest.resource.content.ResolvedImage;
import com.enonic.xp.attachment.Attachment;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.project.Project;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.project.ProjectService;
import com.enonic.xp.security.RoleKeys;

import static com.google.common.base.Strings.isNullOrEmpty;

@Path(ResourceConstants.REST_ROOT + "project/icon")
@Produces("image/*")
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class ProjectIconResource
    implements JaxRsComponent
{
    private ProjectService projectService;

    @GET
    @Path("{projectName}")
    public Response getContentIcon( @PathParam("projectName") final String projectNameAsString, @QueryParam("ts") final String timestamp )
        throws Exception
    {
        if ( projectNameAsString == null )
        {
            throw new WebApplicationException( Response.Status.BAD_REQUEST );
        }

        final ProjectName projectName = ProjectName.from( projectNameAsString );
        final Project project = projectService.get( projectName );
        if ( project == null )
        {
            throw new WebApplicationException( "Project not found: " + projectNameAsString, Response.Status.INTERNAL_SERVER_ERROR );
        }

        final Attachment iconAttachment = project.getIcon();
        final ByteSource iconSource = projectService.getIcon( projectName );
        if ( iconSource == null )
        {
            throw new WebApplicationException( "Icon source not found for project: " + projectNameAsString,
                                               Response.Status.INTERNAL_SERVER_ERROR );
        }

        final ResolvedImage resolvedImage = new ResolvedImage( iconSource, iconAttachment.getMimeType() );

        if ( resolvedImage.isOK() )
        {
            return cacheAndReturnResponse( timestamp, resolvedImage );
        }

        throw new WebApplicationException( Response.Status.NOT_FOUND );
    }

    private Response cacheAndReturnResponse( final String timestamp, final ResolvedImage resolvedImage )
    {
        final boolean cacheForever = !isNullOrEmpty( timestamp );
        if ( cacheForever )
        {
            final CacheControl cacheControl = new CacheControl();
            cacheControl.setMaxAge( Integer.MAX_VALUE );
            return resolvedImage.toResponse( cacheControl );
        }
        else
        {
            return resolvedImage.toResponse();
        }
    }

    @Reference
    public void setProjectService( final ProjectService projectService )
    {
        this.projectService = projectService;
    }

}
