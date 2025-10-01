package com.enonic.xp.app.contentstudio.rest.resource.content.page;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import jakarta.annotation.security.RolesAllowed;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;

import com.enonic.xp.app.contentstudio.json.content.ContentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.JsonObjectsFactory;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.UpdateContentParams;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.page.EditablePage;
import com.enonic.xp.security.RoleKeys;

import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.CONTENT_CMS_PATH;
import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.REST_ROOT;

@Path(REST_ROOT + "{content:(content|" + CONTENT_CMS_PATH + "/content)}/page")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class PageResource
    implements JaxRsComponent
{
    private ContentService contentService;

    private JsonObjectsFactory jsonObjectsFactory;

    @POST
    @Path("create")
    @Consumes(MediaType.APPLICATION_JSON)
    public ContentJson create( final CreatePageJson params, @Context HttpServletRequest request )
    {
        final Content updatedContent = this.contentService.update( new UpdateContentParams().contentId( params.getContentId() )
                                                                       .editor( toBeUpdated -> toBeUpdated.page =
                                                                           new EditablePage( params.getPage() ) ) );

        return jsonObjectsFactory.createContentJson( updatedContent, request );
    }

    @POST
    @Path("update")
    @Consumes(MediaType.APPLICATION_JSON)
    public ContentJson update( final CreatePageJson params, @Context HttpServletRequest request )
    {
        final Content updatedContent = this.contentService.update( new UpdateContentParams().contentId( params.getContentId() )
                                                                       .editor( toBeUpdated -> toBeUpdated.page =
                                                                           new EditablePage( params.getPage() ) ) );

        return jsonObjectsFactory.createContentJson( updatedContent, request );
    }

    @GET
    @Path("delete")
    @Consumes(MediaType.APPLICATION_JSON)
    public ContentJson delete( @QueryParam("contentId") final String contentIdAsString, @Context HttpServletRequest request )
    {
        final ContentId contentId = ContentId.from( contentIdAsString );
        final Content updatedContent =
            this.contentService.update( new UpdateContentParams().contentId( contentId ).editor( toBeUpdated -> toBeUpdated.page = null ) );

        return jsonObjectsFactory.createContentJson( updatedContent, request );
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
