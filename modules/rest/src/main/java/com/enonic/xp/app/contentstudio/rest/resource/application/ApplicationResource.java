package com.enonic.xp.app.contentstudio.rest.resource.application;

import java.util.Comparator;
import java.util.Enumeration;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

import jakarta.annotation.security.RolesAllowed;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.CacheControl;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.app.Application;
import com.enonic.xp.app.ApplicationDescriptor;
import com.enonic.xp.app.ApplicationDescriptorService;
import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.ApplicationNotFoundException;
import com.enonic.xp.app.ApplicationService;
import com.enonic.xp.app.Applications;
import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.app.contentstudio.rest.resource.application.json.ApplicationJson;
import com.enonic.xp.app.contentstudio.rest.resource.application.json.ApplicationKeysJson;
import com.enonic.xp.app.contentstudio.rest.resource.application.json.ListApplicationJson;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.mixin.InlineMixinResolver;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.idprovider.IdProviderDescriptor;
import com.enonic.xp.idprovider.IdProviderDescriptorService;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.schema.mixin.MixinService;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.site.SiteDescriptor;
import com.enonic.xp.site.SiteService;

import static com.google.common.base.Strings.isNullOrEmpty;
import static com.google.common.base.Strings.nullToEmpty;

@Path(ResourceConstants.REST_ROOT + "application")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class ApplicationResource
    implements JaxRsComponent
{
    private ApplicationService applicationService;

    private ApplicationDescriptorService applicationDescriptorService;

    private SiteService siteService;

    private IdProviderDescriptorService idProviderDescriptorService;

    private LocaleService localeService;

    private MixinService mixinService;

    private final ApplicationIconUrlResolver iconUrlResolver;

    private static final ApplicationImageHelper HELPER = new ApplicationImageHelper();

    public ApplicationResource()
    {
        iconUrlResolver = new ApplicationIconUrlResolver();
    }

    @GET
    public ApplicationJson getByKey( @QueryParam("applicationKey") String applicationKey, @Context HttpServletRequest request )
    {
        return doGetByKey( ApplicationKey.from( applicationKey ), request.getLocales() );
    }

    private ApplicationJson doGetByKey( final ApplicationKey appKey, final Enumeration<Locale> locales )
    {
        final Application application = this.applicationService.getInstalledApplication( appKey );

        if ( application == null )
        {
            throw new ApplicationNotFoundException( appKey );
        }

        return applicationToJson( application, locales );
    }

    private ApplicationJson applicationToJson( final Application application, final Enumeration<Locale> locales )
    {
        final ApplicationKey appKey = application.getKey();
        final boolean local = this.applicationService.isLocalApplication( appKey );
        final SiteDescriptor siteDescriptor = this.siteService.getDescriptor( appKey );
        final IdProviderDescriptor idProviderDescriptor = this.idProviderDescriptorService.getDescriptor( appKey );
        final ApplicationDescriptor appDescriptor = applicationDescriptorService.get( appKey );

        return ApplicationJson.create()
            .setApplication( application )
            .setLocal( local )
            .setApplicationDescriptor( appDescriptor )
            .setSiteDescriptor( siteDescriptor )
            .setIdProviderDescriptor( idProviderDescriptor )
            .setIconUrlResolver( this.iconUrlResolver )
            .setLocaleMessageResolver( new LocaleMessageResolver( this.localeService, appKey, locales ) )
            .setInlineMixinResolver( new InlineMixinResolver( this.mixinService ) )
            .build();
    }

    @POST
    @Path("getApplicationsByKeys")
    public ListApplicationJson getByKeys( final ApplicationKeysJson params, @Context HttpServletRequest request )
    {
        final ListApplicationJson listJson = new ListApplicationJson();

        params.getApplicationKeys()
            .stream()
            .map( this.applicationService::get )
            .filter( Objects::nonNull )
            .map( a -> this.applicationToJson( a, request.getLocales() ) )
            .forEach( listJson::add );

        return listJson;
    }

    @GET
    @Path("getSiteApplications")
    public ListApplicationJson getSiteApplications( @QueryParam("query") final String query, @Context HttpServletRequest request )
    {
        final ListApplicationJson json = new ListApplicationJson();

        Applications applications = this.applicationService.list();

        applications = this.filterApplications( applications, query );
        applications = this.sortApplications( applications );

        for ( final Application application : applications )
        {
            final ApplicationKey applicationKey = application.getKey();
            final SiteDescriptor siteDescriptor = this.siteService.getDescriptor( applicationKey );

            if ( siteDescriptor != null )
            {
                final IdProviderDescriptor idProviderDescriptor = this.idProviderDescriptorService.getDescriptor( applicationKey );
                final boolean localApplication = this.applicationService.isLocalApplication( applicationKey );
                final ApplicationDescriptor appDescriptor = this.applicationDescriptorService.get( applicationKey );

                json.add( ApplicationJson.create()
                              .setApplication( application )
                              .setLocal( localApplication )
                              .setApplicationDescriptor( appDescriptor )
                              .setSiteDescriptor( siteDescriptor )
                              .setIdProviderDescriptor( idProviderDescriptor )
                              .setIconUrlResolver( this.iconUrlResolver )
                              .setLocaleMessageResolver(
                                  new LocaleMessageResolver( this.localeService, applicationKey, request.getLocales() ) )
                              .setInlineMixinResolver( new InlineMixinResolver( this.mixinService ) )
                              .build() );
            }
        }
        return json;
    }

    @GET
    @Path("icon/{appKey}")
    @Produces("image/*")
    public Response getIcon( @PathParam("appKey") final String appKeyStr, @QueryParam("hash") final String hash )
        throws Exception
    {
        final ApplicationKey appKey = ApplicationKey.from( appKeyStr );
        final ApplicationDescriptor appDescriptor = applicationDescriptorService.get( appKey );
        final Icon icon = appDescriptor == null ? null : appDescriptor.getIcon();

        final Response.ResponseBuilder responseBuilder;
        if ( icon == null )
        {
            final Icon defaultAppIcon = HELPER.getDefaultApplicationIcon();
            responseBuilder = Response.ok( defaultAppIcon.asInputStream(), defaultAppIcon.getMimeType() );
            applyMaxAge( Integer.MAX_VALUE, responseBuilder );
        }
        else
        {
            responseBuilder = Response.ok( icon.toByteArray(), icon.getMimeType() );
            if ( !isNullOrEmpty( hash ) )
            {
                applyMaxAge( Integer.MAX_VALUE, responseBuilder );
            }
        }

        return responseBuilder.build();
    }

    private void applyMaxAge( int maxAge, final Response.ResponseBuilder responseBuilder )
    {
        final CacheControl cacheControl = new CacheControl();
        cacheControl.setMaxAge( maxAge );
        responseBuilder.cacheControl( cacheControl );
    }

    private Applications sortApplications( final Applications applications )
    {
        return Applications.from(
            applications.stream().sorted( Comparator.comparing( Application::getDisplayName ) ).collect( Collectors.toList() ) );
    }

    private Applications filterApplications( final Applications applications, final String query )
    {
        if ( !nullToEmpty( query ).isBlank() )
        {
            final String queryLowercase = query.toLowerCase();
            return Applications.from( applications.stream()
                                          .filter( application -> nullToEmpty( application.getDisplayName() ).toLowerCase()
                                              .contains( queryLowercase ) ||
                                              nullToEmpty( application.getMaxSystemVersion() ).toLowerCase().contains( queryLowercase ) ||
                                              nullToEmpty( application.getMinSystemVersion() ).toLowerCase().contains( queryLowercase ) ||
                                              nullToEmpty( application.getSystemVersion() ).toLowerCase().contains( queryLowercase ) ||
                                              nullToEmpty( application.getUrl() ).toLowerCase().contains( queryLowercase ) ||
                                              nullToEmpty( application.getVendorName() ).toLowerCase().contains( queryLowercase ) ||
                                              nullToEmpty( application.getVendorUrl() ).toLowerCase().contains( queryLowercase ) )
                                          .collect( Collectors.toList() ) );
        }

        return applications;
    }

    @Reference
    public void setApplicationService( final ApplicationService applicationService )
    {
        this.applicationService = applicationService;
    }

    @Reference
    public void setApplicationDescriptorService( final ApplicationDescriptorService applicationDescriptorService )
    {
        this.applicationDescriptorService = applicationDescriptorService;
    }

    @Reference
    public void setSiteService( final SiteService siteService )
    {
        this.siteService = siteService;
    }

    @Reference
    public void setIdProviderDescriptorService( final IdProviderDescriptorService idProviderDescriptorService )
    {
        this.idProviderDescriptorService = idProviderDescriptorService;
    }

    @Reference
    public void setLocaleService( final LocaleService localeService )
    {
        this.localeService = localeService;
    }

    @Reference
    public void setMixinService( final MixinService mixinService )
    {
        this.mixinService = mixinService;
    }
}

