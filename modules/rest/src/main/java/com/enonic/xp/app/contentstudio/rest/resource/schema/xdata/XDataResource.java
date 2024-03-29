package com.enonic.xp.app.contentstudio.rest.resource.schema.xdata;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.ApplicationWildcardMatcher;
import com.enonic.xp.app.contentstudio.json.schema.xdata.XDataJson;
import com.enonic.xp.app.contentstudio.json.schema.xdata.XDataListJson;
import com.enonic.xp.app.contentstudio.rest.AdminRestConfig;
import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.mixin.InlineMixinResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.mixin.MixinIconResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.mixin.MixinIconUrlResolver;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.mixin.MixinService;
import com.enonic.xp.schema.xdata.XData;
import com.enonic.xp.schema.xdata.XDataService;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.site.SiteDescriptor;
import com.enonic.xp.site.SiteService;
import com.enonic.xp.site.XDataMappings;

import static com.google.common.base.Strings.nullToEmpty;
import static java.util.stream.Collectors.toList;

@Path(ResourceConstants.REST_ROOT + "schema/xdata")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs", configurationPid = "com.enonic.app.contentstudio")
public final class XDataResource
    implements JaxRsComponent
{
    private XDataService xDataService;

    private SiteService siteService;

    private LocaleService localeService;

    private MixinService mixinService;

    private MixinIconUrlResolver mixinIconUrlResolver;

    private ApplicationWildcardMatcher.Mode contentTypeParseMode;

    @Activate
    @Modified
    public void activate( final AdminRestConfig config )
    {
        contentTypeParseMode = ApplicationWildcardMatcher.Mode.valueOf( config.contentTypePatternMode() );
    }

    @GET
    @Path("getApplicationXDataForContentType")
    public XDataListJson getApplicationXDataForContentType( @QueryParam("contentTypeName") final String contentTypeName,
                                                            @QueryParam("applicationKey") final String key )
    {
        final XDataListJson result = new XDataListJson();

        final SiteDescriptor siteDescriptor = siteService.getDescriptor( ApplicationKey.from( key ) );

        final Map<XData, Boolean> siteXData =
            this.getXDatasByContentType( siteDescriptor.getXDataMappings(), ContentTypeName.from( contentTypeName ) );

        result.addXDatas( createXDataListJson( siteXData ) );

        return result;
    }

    private List<XDataJson> createXDataListJson( final Map<XData, Boolean> xDatas )
    {
        return xDatas.keySet()
            .stream()
            .map( xData -> XDataJson.create()
                .setXData( xData )
                .setIconUrlResolver( this.mixinIconUrlResolver )
                .setLocaleMessageResolver( new LocaleMessageResolver( localeService, xData.getName().getApplicationKey() ) )
                .setInlineMixinResolver( new InlineMixinResolver( mixinService ) )
                .setOptional( xDatas.get( xData ) )
                .build() )
            .distinct()
            .collect( toList() );
    }

    private Map<XData, Boolean> getXDatasByContentType( final XDataMappings xDataMappings, final ContentTypeName contentTypeName )
    {
        final Map<XData, Boolean> result = new LinkedHashMap<>();

        xDataMappings.stream().filter( xDataMapping -> {
            final String wildcard = xDataMapping.getAllowContentTypes();
            final ApplicationKey applicationKey = xDataMapping.getXDataName().getApplicationKey();

            return nullToEmpty( wildcard ).isBlank() ||
                new ApplicationWildcardMatcher<>( applicationKey, ContentTypeName::toString, contentTypeParseMode ).matches( wildcard,
                                                                                                                             contentTypeName );
        } ).forEach( xDataMapping -> {
            final XData xData = this.xDataService.getByName( xDataMapping.getXDataName() );
            if ( xData != null )
            {
                result.putIfAbsent( xData, xDataMapping.getOptional() );
            }
        } );

        return result;
    }

    @Reference
    public void setXDataService( final XDataService xDataService )
    {
        this.xDataService = xDataService;
    }

    @Reference
    public void setLocaleService( final LocaleService localeService )
    {
        this.localeService = localeService;
    }

    @Reference
    public void setSiteService( final SiteService siteService )
    {
        this.siteService = siteService;
    }

    @Reference
    public void setMixinService( final MixinService mixinService )
    {
        this.mixinService = mixinService;
        this.mixinIconUrlResolver = new MixinIconUrlResolver( new MixinIconResolver( mixinService ) );
    }
}


