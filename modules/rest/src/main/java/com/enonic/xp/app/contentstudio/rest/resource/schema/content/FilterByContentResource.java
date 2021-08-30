package com.enonic.xp.app.contentstudio.rest.resource.schema.content;

import java.util.stream.Collectors;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.app.contentstudio.json.content.page.PageDescriptorListJson;
import com.enonic.xp.app.contentstudio.json.content.page.region.LayoutDescriptorsJson;
import com.enonic.xp.app.contentstudio.json.content.page.region.PartDescriptorsJson;
import com.enonic.xp.app.contentstudio.json.schema.content.ContentTypeSummaryListJson;
import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.app.contentstudio.rest.resource.content.JsonObjectsFactory;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.security.RoleKeys;

@Path(ResourceConstants.REST_ROOT + "{content:(" + ResourceConstants.CMS_PATH + "/schema)}/filter")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public class FilterByContentResource
    implements JaxRsComponent
{
    private JsonObjectsFactory jsonObjectsFactory;

    private FilterByContentResolver filterByContentResolver;

    public FilterByContentResource()
    {
        int i = 0;
    }

    @GET
    @Path("contentTypes")
    public ContentTypeSummaryListJson contentTypes( @QueryParam("contentId") final String contentId )
    {
        return new ContentTypeSummaryListJson(
            filterByContentResolver.contentTypes( contentId == null ? null : ContentId.from( contentId ) )
                .map( jsonObjectsFactory::createContentTypeSummaryJson )
                .collect( Collectors.toUnmodifiableList() ) );
    }

    @GET
    @Path("layouts")
    public LayoutDescriptorsJson layouts( @QueryParam("contentId") final String contentId )
    {
        return new LayoutDescriptorsJson( filterByContentResolver.layouts( ContentId.from( contentId ) )
                                              .map( jsonObjectsFactory::createLayoutDescriptorJson )
                                              .collect( Collectors.toUnmodifiableList() ) );
    }

    @GET
    @Path("parts")
    public PartDescriptorsJson parts( @QueryParam("contentId") final String contentId )
    {
        return new PartDescriptorsJson( filterByContentResolver.parts( ContentId.from( contentId ) )
                                            .map( jsonObjectsFactory::createPartDescriptorJson )
                                            .collect( Collectors.toUnmodifiableList() ) );
    }

    @GET
    @Path("pages")
    public PageDescriptorListJson pages( @QueryParam("contentId") final String contentId )
    {
        return new PageDescriptorListJson( filterByContentResolver.pages( ContentId.from( contentId ) )
                                               .map( jsonObjectsFactory::createPageDescriptorJson )
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
