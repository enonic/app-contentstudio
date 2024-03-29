package com.enonic.xp.app.contentstudio.rest.resource.widget;

import java.util.List;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.CacheControl;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.admin.widget.WidgetDescriptor;
import com.enonic.xp.admin.widget.WidgetDescriptorService;
import com.enonic.xp.app.ApplicationDescriptor;
import com.enonic.xp.app.ApplicationDescriptorService;
import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.widget.json.WidgetDescriptorJson;
import com.enonic.xp.descriptor.Descriptors;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.page.DescriptorKey;
import com.enonic.xp.security.RoleKeys;

import static com.google.common.base.Strings.isNullOrEmpty;
import static java.util.stream.Collectors.toList;

@Path(ResourceConstants.REST_ROOT + "widget")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public class WidgetResource
    implements JaxRsComponent
{
    private static final WidgetImageHelper HELPER = new WidgetImageHelper();

    private WidgetDescriptorService widgetDescriptorService;

    private ApplicationDescriptorService applicationDescriptorService;

    private LocaleService localeService;

    @POST
    @Path("list/byinterfaces")
    public List<WidgetDescriptorJson> getByInterfaces( final String[] widgetInterfaces )
    {
        final Descriptors<WidgetDescriptor> widgetDescriptors = this.widgetDescriptorService.getAllowedByInterfaces( widgetInterfaces );
        return widgetDescriptorsToJsonList( widgetDescriptors );
    }

    private List<WidgetDescriptorJson> widgetDescriptorsToJsonList( final Descriptors<WidgetDescriptor> descriptors )
    {
        return descriptors.stream().map( this::convertToJsonAndLocalize ).collect( toList() );
    }

    private WidgetDescriptorJson convertToJsonAndLocalize( final WidgetDescriptor widgetDescriptor )
    {
        final WidgetDescriptorJson json = new WidgetDescriptorJson( widgetDescriptor );

        if ( !isNullOrEmpty( widgetDescriptor.getDisplayNameI18nKey() ) || !isNullOrEmpty( widgetDescriptor.getDescriptionI18nKey() ) )
        {
            final LocaleMessageResolver messageResolver = new LocaleMessageResolver( localeService, widgetDescriptor.getApplicationKey() );

            if ( !isNullOrEmpty( widgetDescriptor.getDisplayNameI18nKey() ) )
            {
                json.displayName =
                    messageResolver.localizeMessage( widgetDescriptor.getDisplayNameI18nKey(), widgetDescriptor.getDisplayName() );
            }

            if ( !isNullOrEmpty( widgetDescriptor.getDescriptionI18nKey() ) )
            {
                json.description =
                    messageResolver.localizeMessage( widgetDescriptor.getDescriptionI18nKey(), widgetDescriptor.getDescription() );
            }
        }

        return json;
    }

    @GET
    @Path("icon/{appKey}/{descriptorName}")
    @Produces("image/*")
    public Response getIcon( @PathParam("appKey") final String appKeyStr, @PathParam("descriptorName") final String descriptorName,
                             @QueryParam("hash") final String hash )
        throws Exception
    {
        final ApplicationKey appKey = ApplicationKey.from( appKeyStr );
        final DescriptorKey descriptorKey = DescriptorKey.from( appKey, descriptorName );
        final WidgetDescriptor widgetDescriptor = this.widgetDescriptorService.getByKey( descriptorKey );
        final Icon icon = widgetDescriptor == null ? null : widgetDescriptor.getIcon();

        final Response.ResponseBuilder responseBuilder;
        if ( icon == null )
        {
            final ApplicationDescriptor appDescriptor = this.applicationDescriptorService.get( appKey );
            final Icon appIcon = appDescriptor == null ? null : appDescriptor.getIcon();

            if ( appIcon == null )
            {
                final Icon defaultAppIcon = HELPER.getDefaultWidgetIcon();
                responseBuilder = Response.ok( defaultAppIcon.asInputStream(), defaultAppIcon.getMimeType() );
                applyMaxAge( responseBuilder );
            }
            else
            {
                responseBuilder = Response.ok( appIcon.toByteArray(), appIcon.getMimeType() );
                if ( !isNullOrEmpty( hash ) )
                {
                    applyMaxAge( responseBuilder );
                }
            }
        }
        else
        {
            responseBuilder = Response.ok( icon.toByteArray(), icon.getMimeType() );
            if ( !isNullOrEmpty( hash ) )
            {
                applyMaxAge( responseBuilder );
            }
        }

        return responseBuilder.build();
    }

    private void applyMaxAge( final Response.ResponseBuilder responseBuilder )
    {
        final CacheControl cacheControl = new CacheControl();
        cacheControl.setMaxAge( Integer.MAX_VALUE );
        responseBuilder.cacheControl( cacheControl );
    }

    @Reference
    public void setWidgetDescriptorService( final WidgetDescriptorService widgetDescriptorService )
    {
        this.widgetDescriptorService = widgetDescriptorService;
    }

    @Reference
    public void setApplicationDescriptorService( final ApplicationDescriptorService applicationDescriptorService )
    {
        this.applicationDescriptorService = applicationDescriptorService;
    }

    @Reference
    public void setLocaleService( final LocaleService localeService )
    {
        this.localeService = localeService;
    }

}
