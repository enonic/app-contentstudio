package com.enonic.app.contentstudio.rest.resource.content.page.layout;

import java.util.stream.Collectors;

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

import com.enonic.xp.app.ApplicationKey;
import com.enonic.app.contentstudio.json.content.page.region.LayoutDescriptorJson;
import com.enonic.app.contentstudio.json.content.page.region.LayoutDescriptorsJson;
import com.enonic.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.app.contentstudio.rest.resource.content.JsonObjectsFactory;
import com.enonic.xp.descriptor.DescriptorKey;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.region.LayoutDescriptor;
import com.enonic.xp.region.LayoutDescriptorService;
import com.enonic.xp.region.LayoutDescriptors;
import com.enonic.xp.security.RoleKeys;

@Path(ResourceConstants.REST_ROOT + "content/page/layout/descriptor")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class LayoutDescriptorResource
    implements JaxRsComponent
{
    private LayoutDescriptorService layoutDescriptorService;

    private JsonObjectsFactory jsonObjectsFactory;

    @GET
    public LayoutDescriptorJson getByKey( @QueryParam("key") final String layoutDescriptorKey, @Context HttpServletRequest request )
    {
        final DescriptorKey key = DescriptorKey.from( layoutDescriptorKey );
        final LayoutDescriptor descriptor = layoutDescriptorService.getByKey( key );

        return jsonObjectsFactory.createLayoutDescriptorJson( descriptor, request.getLocales() );
    }

    @GET
    @Path("list/by_application")
    public LayoutDescriptorsJson getByApplications( @QueryParam("applicationKey") final String applicationKey,
                                                    @Context HttpServletRequest request )
    {
        final LayoutDescriptors descriptors = layoutDescriptorService.getByApplication( ApplicationKey.from( applicationKey ) );

        return new LayoutDescriptorsJson(
            descriptors.stream().map( l -> jsonObjectsFactory.createLayoutDescriptorJson( l, request.getLocales() ) ).collect(
                Collectors.toUnmodifiableList() ) );
    }

    @POST
    @Path("list/by_applications")
    @Consumes(MediaType.APPLICATION_JSON)
    public LayoutDescriptorsJson getByApplications( final GetByApplicationsParams params, @Context HttpServletRequest request )
    {
        final LayoutDescriptors layoutDescriptors = layoutDescriptorService.getByApplications( params.getApplicationKeys() );
        return new LayoutDescriptorsJson(
            layoutDescriptors.stream().map( l -> jsonObjectsFactory.createLayoutDescriptorJson( l, request.getLocales() ) ).collect(
                Collectors.toUnmodifiableList() ) );
    }

    @Reference
    public void setLayoutDescriptorService( final LayoutDescriptorService layoutDescriptorService )
    {
        this.layoutDescriptorService = layoutDescriptorService;
    }

    @Reference
    public void setJsonObjectsFactory( final JsonObjectsFactory jsonObjectsFactory )
    {
        this.jsonObjectsFactory = jsonObjectsFactory;
    }
}
