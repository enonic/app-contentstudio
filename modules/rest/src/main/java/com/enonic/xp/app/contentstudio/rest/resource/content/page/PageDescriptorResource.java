package com.enonic.xp.app.contentstudio.rest.resource.content.page;

import java.util.Enumeration;
import java.util.Locale;
import java.util.stream.Collectors;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.google.common.collect.ImmutableList;

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
import com.enonic.xp.app.contentstudio.json.content.page.PageDescriptorJson;
import com.enonic.xp.app.contentstudio.json.content.page.PageDescriptorListJson;
import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.app.contentstudio.rest.resource.content.page.part.GetByApplicationsParams;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.mixin.InlineMixinResolver;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.page.DescriptorKey;
import com.enonic.xp.page.PageDescriptor;
import com.enonic.xp.page.PageDescriptorService;
import com.enonic.xp.page.PageDescriptors;
import com.enonic.xp.schema.mixin.MixinService;
import com.enonic.xp.security.RoleKeys;

@Path(ResourceConstants.REST_ROOT + "content/page/descriptor")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class PageDescriptorResource
    implements JaxRsComponent
{
    private PageDescriptorService pageDescriptorService;

    private LocaleService localeService;

    private MixinService mixinService;

    @GET
    public PageDescriptorJson getByKey( @QueryParam("key") final String pageDescriptorKey, @Context HttpServletRequest request )
    {
        final DescriptorKey key = DescriptorKey.from( pageDescriptorKey );
        final PageDescriptor descriptor = pageDescriptorService.getByKey( key );

        final LocaleMessageResolver localeMessageResolver =
            new LocaleMessageResolver( this.localeService, key.getApplicationKey(), request.getLocales() );
        final InlineMixinResolver inlineMixinResolver = new InlineMixinResolver( this.mixinService );
        final PageDescriptorJson json = new PageDescriptorJson( descriptor, localeMessageResolver, inlineMixinResolver );
        return json;
    }

    @GET
    @Path("list/by_application")
    public PageDescriptorListJson getByApplication( @QueryParam("applicationKey") final String applicationKey,
                                                    @Context HttpServletRequest request )
    {
        final PageDescriptors pageDescriptors = this.pageDescriptorService.getByApplication( ApplicationKey.from( applicationKey ) );

        final LocaleMessageResolver localeMessageResolver =
            new LocaleMessageResolver( this.localeService, ApplicationKey.from( applicationKey ), request.getLocales() );
        return new PageDescriptorListJson( PageDescriptors.from( pageDescriptors ), localeMessageResolver,
                                           new InlineMixinResolver( mixinService ) );
    }

    @POST
    @Path("list/by_applications")
    @Consumes(MediaType.APPLICATION_JSON)
    public PageDescriptorListJson getByApplications( final GetByApplicationsParams params, @Context HttpServletRequest request )
    {
        ImmutableList.Builder<PageDescriptorJson> pageDescriptorsJsonBuilder = new ImmutableList.Builder();

        params.getApplicationKeys().forEach( applicationKey -> {
            pageDescriptorsJsonBuilder.addAll( this.pageDescriptorService.getByApplication( applicationKey )
                                                   .stream()
                                                   .map( p -> createPageDescriptorJson( p, applicationKey, request.getLocales() ) )
                                                   .collect( Collectors.toList() ) );
        } );

        return new PageDescriptorListJson( pageDescriptorsJsonBuilder.build() );
    }

    private PageDescriptorJson createPageDescriptorJson( final PageDescriptor pageDescriptor, final ApplicationKey applicationKey,
                                                         final Enumeration<Locale> locales )

    {
        return new PageDescriptorJson( pageDescriptor, new LocaleMessageResolver( localeService, applicationKey, locales ),
                                       new InlineMixinResolver( mixinService ) );
    }

    @Reference
    public void setPageDescriptorService( final PageDescriptorService pageDescriptorService )
    {
        this.pageDescriptorService = pageDescriptorService;
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
