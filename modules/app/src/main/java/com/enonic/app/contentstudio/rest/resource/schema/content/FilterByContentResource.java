package com.enonic.app.contentstudio.rest.resource.schema.content;

import java.util.stream.Collectors;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.OPTIONS;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import com.enonic.app.contentstudio.json.content.page.PageDescriptorListJson;
import com.enonic.app.contentstudio.json.content.page.region.LayoutDescriptorsJson;
import com.enonic.app.contentstudio.json.content.page.region.PartDescriptorsJson;
import com.enonic.app.contentstudio.json.schema.content.ContentTypeSummaryListJson;
import com.enonic.app.contentstudio.rest.resource.EnableCORS;
import com.enonic.app.contentstudio.rest.resource.content.JsonObjectsFactory;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.security.RoleKeys;

import static com.enonic.app.contentstudio.rest.resource.ResourceConstants.CONTENT_CMS_PATH;
import static com.enonic.app.contentstudio.rest.resource.ResourceConstants.REST_ROOT;

@Path(REST_ROOT + "{content:(" + CONTENT_CMS_PATH + ")}/schema/filter")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public class FilterByContentResource
    implements JaxRsComponent
{
    private JsonObjectsFactory jsonObjectsFactory;

    private FilterByContentResolver filterByContentResolver;

    @POST
    @Path("contentTypes")
    public ContentTypeSummaryListJson contentTypes( GetContentTypesJson json, @Context HttpServletRequest request )
    {
        return new ContentTypeSummaryListJson( filterByContentResolver.contentTypes( json.getContentId(), json.getAllowedContentTypes() )
                                                   .map( t -> jsonObjectsFactory.createContentTypeSummaryJson(t, request) )
                                                   .collect( Collectors.toUnmodifiableList() ) );
    }

    @GET
    @Path("layouts")
    @EnableCORS
    @RolesAllowed({"system.everyone"})
    public LayoutDescriptorsJson layouts( @QueryParam("contentId") final String contentId, @Context HttpServletRequest request )
    {
        return new LayoutDescriptorsJson( filterByContentResolver.layouts( ContentId.from( contentId ) )
                                              .map( l -> jsonObjectsFactory.createLayoutDescriptorJson(l, request.getLocales()) )
                                              .collect( Collectors.toUnmodifiableList() ) );
    }

    @GET
    @Path("parts")
    @EnableCORS
    @RolesAllowed({"system.everyone"})
    public PartDescriptorsJson parts( @QueryParam("contentId") final String contentId, @Context HttpServletRequest request )
    {
        return new PartDescriptorsJson( filterByContentResolver.parts( ContentId.from( contentId ) )
                                            .map( p -> jsonObjectsFactory.createPartDescriptorJson(p, request) )
                                            .collect( Collectors.toUnmodifiableList() ) );
    }

    @GET
    @Path("pages")
    public PageDescriptorListJson pages( @QueryParam("contentId") final String contentId, @Context HttpServletRequest request )
    {
        return new PageDescriptorListJson( filterByContentResolver.pages( ContentId.from( contentId ) )
                                               .map( p -> jsonObjectsFactory.createPageDescriptorJson(p, request.getLocales()) )
                                               .collect( Collectors.toUnmodifiableList() ) );
    }

    @OPTIONS
    @Path("{path : .*}")
    @EnableCORS // <--- Ensures the CORS filter runs for this too!
    @PermitAll
    public Response options()
    {
        // We return 200 OK.
        // The CORSFilter will intercept this response and add the headers.
        return Response.ok().build();
    }

    @Reference
    public void setJsonObjectsFactory( final JsonObjectsFactory jsonObjectsFactory )
    {
        this.jsonObjectsFactory = jsonObjectsFactory;
    }

    @Reference
    public void setFilterByContentResolver( final FilterByContentResolver filterByContentResolver )
    {
        this.filterByContentResolver = filterByContentResolver;
    }
}
