package com.enonic.xp.app.contentstudio.rest.resource.schema.xdata;

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
import com.enonic.xp.app.contentstudio.json.schema.xdata.XDataJson;
import com.enonic.xp.app.contentstudio.json.schema.xdata.XDataListJson;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.mixin.InlineMixinResolver;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.mixin.MixinService;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.site.SiteConfig;
import com.enonic.xp.site.SiteConfigService;
import com.enonic.xp.site.SiteConfigsDataSerializer;
import com.enonic.xp.site.XDataMappingService;
import com.enonic.xp.site.XDataOptions;

import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.CONTENT_CMS_PATH;
import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.REST_ROOT;
import static java.util.stream.Collectors.toList;

@Path(REST_ROOT + "{content:(" + CONTENT_CMS_PATH + ")}/schema/xdata")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs", configurationPid = "com.enonic.app.contentstudio")
public final class XDataContextResource
    implements JaxRsComponent
{
    private ContentService contentService;

    private LocaleService localeService;

    private MixinService mixinService;

    private XDataMappingService xDataMappingService;

    private SiteConfigService siteConfigService;

    @Activate
    @Modified
    public void activate()
    {
    }

    @GET
    @Path("getContentXData")
    public XDataListJson getContentXData( @QueryParam("contentId") final String id, @Context HttpServletRequest request )
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

        final XDataOptions xDataOptions = xDataMappingService.getXDataMappingOptions( content.getType(), applicationKeys.build() );

        final XDataListJson result = new XDataListJson();
        result.addXDatas( createXDataListJson( xDataOptions, request ) );

        return result;
    }

    @GET
    @Path("getApplicationXDataForContentType")
    public XDataListJson getApplicationXDataForContentType( @QueryParam("contentTypeName") final String contentTypeName,
                                                            @QueryParam("applicationKey") final String key,
                                                            @Context HttpServletRequest request )
    {
        final XDataListJson result = new XDataListJson();

        final XDataOptions xDataOptions =
            xDataMappingService.getXDataMappingOptions( ContentTypeName.from( contentTypeName ), ApplicationKeys.from( key ) );

        result.addXDatas( createXDataListJson( xDataOptions, request ) );

        return result;
    }

    private List<XDataJson> createXDataListJson( final XDataOptions xDataOptions, @Context HttpServletRequest request )
    {
        return xDataOptions
            .stream()
            .map( xData -> XDataJson.create().setXData( xData.xdata() )
                .setLocaleMessageResolver(
                    new LocaleMessageResolver( localeService, xData.xdata().getName().getApplicationKey(), request.getLocales() ) )
                .setInlineMixinResolver( new InlineMixinResolver( mixinService ) ).setOptional( xData.optional() )
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
    public void setMixinService( final MixinService mixinService )
    {
        this.mixinService = mixinService;
    }

    @Reference
    public void setXDataMappingService( final XDataMappingService xDataMappingService )
    {
        this.xDataMappingService = xDataMappingService;
    }

    @Reference
    public void setSiteConfigService( final SiteConfigService siteConfigService )
    {
        this.siteConfigService = siteConfigService;
    }
}


