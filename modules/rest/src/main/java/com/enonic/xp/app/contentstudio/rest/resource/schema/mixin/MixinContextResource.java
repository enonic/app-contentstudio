package com.enonic.xp.app.contentstudio.rest.resource.schema.mixin;

import java.util.List;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;

import jakarta.annotation.security.RolesAllowed;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.ApplicationKeys;
import com.enonic.xp.app.contentstudio.json.schema.xdata.MixinJson;
import com.enonic.xp.app.contentstudio.json.schema.xdata.MixinsJson;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.formfragment.CmsFormFragmentResolver;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.schema.content.CmsFormFragmentService;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.site.MixinMappingService;
import com.enonic.xp.site.MixinOptions;
import com.enonic.xp.site.SiteConfig;
import com.enonic.xp.site.SiteConfigService;
import com.enonic.xp.site.SiteConfigsDataSerializer;

import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.CONTENT_CMS_PATH;
import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.REST_ROOT;
import static java.util.stream.Collectors.toList;

@Path(REST_ROOT + "{content:(" + CONTENT_CMS_PATH + ")}/schema/mixins")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs", configurationPid = "com.enonic.app.contentstudio")
public final class MixinContextResource
    implements JaxRsComponent
{
    private ContentService contentService;

    private LocaleService localeService;

    private CmsFormFragmentService cmsFormFragmentService;

    private MixinMappingService mixinMappingService;

    private SiteConfigService siteConfigService;

    @Activate
    @Modified
    public void activate()
    {
    }

    @GET
    @Path("getContentMixins")
    public MixinsJson getContentMixins( @QueryParam("contentId") final String id, @Context HttpServletRequest request )
    {
        final ContentId contentId = ContentId.from( id );
        final Content content = this.contentService.getById( contentId );

        final ApplicationKeys.Builder applicationKeys = ApplicationKeys.create().add( ApplicationKey.PORTAL );

        if ( content.isSite() )
        {
            SiteConfigsDataSerializer.fromData( content.getData().getRoot() )
                .stream()
                .map( SiteConfig::getApplicationKey )
                .forEach( applicationKeys::add );
        }
        else
        {
            siteConfigService.getSiteConfigs( content.getPath().getParentPath() )
                .stream()
                .map( SiteConfig::getApplicationKey )
                .forEach( applicationKeys::add );
        }

        final MixinOptions mixinOptions = mixinMappingService.getMixinMappingOptions( content.getType(), applicationKeys.build() );

        final MixinsJson result = new MixinsJson();
        result.addMixins( createMixinsJson( mixinOptions, request ) );

        return result;
    }

    @GET
    @Path("getApplicationMixinsForContentType")
    public MixinsJson getApplicationXDataForContentType( @QueryParam("contentTypeName") final String contentTypeName,
                                                         @QueryParam("applicationKey") final String key,
                                                         @Context HttpServletRequest request )
    {
        final MixinsJson result = new MixinsJson();

        final MixinOptions mixinOptions =
            mixinMappingService.getMixinMappingOptions( ContentTypeName.from( contentTypeName ), ApplicationKeys.from( key ) );

        result.addMixins( createMixinsJson( mixinOptions, request ) );

        return result;
    }

    private List<MixinJson> createMixinsJson( final MixinOptions mixinOptions, @Context HttpServletRequest request )
    {
        return mixinOptions
            .stream()
            .map( mixinOption -> MixinJson.create().setMixin( mixinOption.mixinDescriptor() )
                .setLocaleMessageResolver(
                    new LocaleMessageResolver( localeService, mixinOption.mixinDescriptor().getName().getApplicationKey(), request.getLocales() ) )
                .setInlineMixinResolver( new CmsFormFragmentResolver( cmsFormFragmentService ) ).setOptional( mixinOption.optional() )
                .build() )
            .distinct()
            .collect( toList() );
    }

    @Reference
    public void setLocaleService( final LocaleService localeService )
    {
        this.localeService = localeService;
    }


    @Reference
    public void setContentService( final ContentService contentService )
    {
        this.contentService = contentService;
    }


    @Reference
    public void setCmsFormFragmentService( final CmsFormFragmentService cmsFormFragmentService )
    {
        this.cmsFormFragmentService = cmsFormFragmentService;
    }

    @Reference
    public void setMixinMappingService( final MixinMappingService mixinMappingService )
    {
        this.mixinMappingService = mixinMappingService;
    }

    @Reference
    public void setSiteConfigService( final SiteConfigService siteConfigService )
    {
        this.siteConfigService = siteConfigService;
    }
}


