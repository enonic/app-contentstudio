package com.enonic.xp.app.contentstudio.rest.resource.schema.content;

import java.util.stream.Collectors;

import jakarta.annotation.security.RolesAllowed;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.app.contentstudio.json.content.page.PageDescriptorListJson;
import com.enonic.xp.app.contentstudio.json.content.page.region.LayoutDescriptorsJson;
import com.enonic.xp.app.contentstudio.json.content.page.region.PartDescriptorsJson;
import com.enonic.xp.app.contentstudio.json.schema.content.ContentTypeSummaryListJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.JsonObjectsFactory;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.security.RoleKeys;

import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.CONTENT_CMS_PATH;
import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.REST_ROOT;

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
    public LayoutDescriptorsJson layouts( @QueryParam("contentId") final String contentId, @Context HttpServletRequest request )
    {
        return new LayoutDescriptorsJson( filterByContentResolver.layouts( ContentId.from( contentId ) )
                                              .map( l -> jsonObjectsFactory.createLayoutDescriptorJson(l, request.getLocales()) )
                                              .collect( Collectors.toUnmodifiableList() ) );
    }

    @GET
    @Path("parts")
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
