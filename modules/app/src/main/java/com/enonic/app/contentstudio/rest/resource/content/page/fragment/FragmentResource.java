package com.enonic.app.contentstudio.rest.resource.content.page.fragment;

import jakarta.annotation.security.RolesAllowed;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.enonic.app.contentstudio.json.content.ContentJson;
import com.enonic.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.app.contentstudio.rest.resource.content.JsonObjectsFactory;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.region.CreateFragmentParams;
import com.enonic.xp.region.FragmentService;
import com.enonic.xp.security.RoleKeys;


@Path(ResourceConstants.REST_ROOT + "{content:(content|" + ResourceConstants.CONTENT_CMS_PATH + "/content)}/page/fragment")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class FragmentResource
    implements JaxRsComponent
{
    private FragmentService fragmentService;

    private ContentService contentService;

    private JsonObjectsFactory jsonObjectsFactory;

    @POST
    @Path("create")
    @Consumes(MediaType.APPLICATION_JSON)
    public ContentJson createFragment( final CreateFragmentJson params, @Context HttpServletRequest request )
    {
        final CreateFragmentParams command = CreateFragmentParams.create()
            .parent( getContentPath( params.getParent() ) )
            .component( params.getComponent() )
            .config( params.getConfig() )
            .workflowInfo( params.getWorkflowInfo() )
            .build();
        final Content fragmentContent = this.fragmentService.create( command );

        return jsonObjectsFactory.createContentJson( fragmentContent, request );
    }

    private ContentPath getContentPath( final ContentId contentId )
    {
        return this.contentService.getById( contentId ).getPath();
    }

    @Reference
    public void setFragmentService( final FragmentService fragmentService )
    {
        this.fragmentService = fragmentService;
    }

    @Reference
    public void setContentService( final ContentService contentService )
    {
        this.contentService = contentService;
    }

    @Reference
    public void setJsonObjectsFactory( final JsonObjectsFactory jsonObjectsFactory )
    {
        this.jsonObjectsFactory = jsonObjectsFactory;
    }
}
