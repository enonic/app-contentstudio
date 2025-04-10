package com.enonic.xp.app.contentstudio.rest.resource.schema.xdata;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import jakarta.annotation.security.RolesAllowed;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.ApplicationWildcardMatcher;
import com.enonic.xp.app.contentstudio.json.schema.xdata.XDataJson;
import com.enonic.xp.app.contentstudio.json.schema.xdata.XDataListJson;
import com.enonic.xp.app.contentstudio.rest.AdminRestConfig;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.mixin.InlineMixinResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.mixin.MixinIconResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.mixin.MixinIconUrlResolver;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.project.ProjectService;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.content.GetContentTypeParams;
import com.enonic.xp.schema.mixin.MixinService;
import com.enonic.xp.schema.xdata.XData;
import com.enonic.xp.schema.xdata.XDataService;
import com.enonic.xp.schema.xdata.XDatas;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.site.Site;
import com.enonic.xp.site.SiteConfig;
import com.enonic.xp.site.SiteService;
import com.enonic.xp.site.XDataMappings;

import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.CONTENT_CMS_PATH;
import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.REST_ROOT;
import static com.google.common.base.Strings.nullToEmpty;
import static java.util.stream.Collectors.toList;

@Path(REST_ROOT + "{content:(" + CONTENT_CMS_PATH + ")}/schema/xdata")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs", configurationPid = "com.enonic.app.contentstudio")
public final class XDataContextResource
    implements JaxRsComponent
{
    private XDataService xDataService;

    private ContentService contentService;

    private SiteService siteService;

    private ContentTypeService contentTypeService;

    private LocaleService localeService;

    private MixinService mixinService;

    private ProjectService projectService;

    private MixinIconUrlResolver mixinIconUrlResolver;

    private ApplicationWildcardMatcher.Mode contentTypeParseMode;

    @Activate
    @Modified
    public void activate( final AdminRestConfig config )
    {
        contentTypeParseMode = ApplicationWildcardMatcher.Mode.valueOf( config.contentTypePatternMode() );
    }

    @GET
    @Path("getContentXData")
    public XDataListJson getContentXData( @QueryParam("contentId") final String id, @Context HttpServletRequest request )
    {
        final ContentId contentId = ContentId.from( id );
        final Content content = this.contentService.getById( contentId );

        final XDataListJson result = new XDataListJson();

        final Map<XData, Boolean> resultXData = new LinkedHashMap<>();

        getContentTypeXData( content ).forEach( xData -> resultXData.putIfAbsent( xData, false ) );

        getSiteXData( content ).forEach( resultXData::putIfAbsent );

        getProjectXData( content ).forEach( resultXData::putIfAbsent );

        result.addXDatas( createXDataListJson( resultXData, request ) );

        return result;
    }

    private List<XDataJson> createXDataListJson( final Map<XData, Boolean> xDatas, @Context HttpServletRequest request )
    {
        return xDatas.keySet()
            .stream()
            .map( xData -> XDataJson.create()
                .setXData( xData )
                .setIconUrlResolver( this.mixinIconUrlResolver )
                .setLocaleMessageResolver(
                    new LocaleMessageResolver( localeService, xData.getName().getApplicationKey(), request.getLocales() ) )
                .setInlineMixinResolver( new InlineMixinResolver( mixinService ) )
                .setOptional( xDatas.get( xData ) )
                .build() )
            .distinct()
            .collect( toList() );
    }

    private Map<XData, Boolean> getSiteXData( final Content content )
    {
        final Map<XData, Boolean> result = new LinkedHashMap<>();

        final Site nearestSite = this.contentService.getNearestSite( content.getId() );

        if ( nearestSite != null )
        {
            final List<ApplicationKey> applicationKeys =
                nearestSite.getSiteConfigs().stream().map( SiteConfig::getApplicationKey ).collect( toList() );

            return getXDataByApps( applicationKeys, content.getType() );

        }
        return result;
    }

    private Map<XData, Boolean> getProjectXData( final Content content )
    {
        final RepositoryId repositoryId = ContextAccessor.current().getRepositoryId();
        return contentService.getNearestSite( content.getId() ) == null ? Optional.ofNullable(
            repositoryId != null ? ProjectName.from( repositoryId ) : null ).map( projectService::get ).map(
            project -> getXDataByApps( project.getSiteConfigs().getApplicationKeys(), content.getType() ) ).orElseGet( Map::of ) : Map.of();
    }

    private Map<XData, Boolean> getXDataByApps( final Collection<ApplicationKey> applicationKeys, final ContentTypeName contentType )
    {

        return applicationKeys.stream()
            .map( applicationKey -> siteService.getDescriptor( applicationKey ) )
            .filter( Objects::nonNull )
            .map( siteDescriptor -> this.getXDatasByContentType( siteDescriptor.getXDataMappings(), contentType ) )
            .flatMap( xDataBooleanMap -> xDataBooleanMap.entrySet().stream() )
            .collect( Collectors.toMap( Map.Entry::getKey, Map.Entry::getValue ) );
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

    private XDatas getContentTypeXData( final Content content )
    {
        final ContentType contentType = this.contentTypeService.getByName( GetContentTypeParams.from( content.getType() ) );

        return this.xDataService.getByNames( contentType.getXData() );
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
    public void setContentService( final ContentService contentService )
    {
        this.contentService = contentService;
    }


    @Reference
    public void setSiteService( final SiteService siteService )
    {
        this.siteService = siteService;
    }

    @Reference
    public void setContentTypeService( final ContentTypeService contentTypeService )
    {
        this.contentTypeService = contentTypeService;
    }

    @Reference
    public void setMixinService( final MixinService mixinService )
    {
        this.mixinService = mixinService;
        this.mixinIconUrlResolver = new MixinIconUrlResolver( new MixinIconResolver( mixinService ) );
    }

    @Reference
    public void setProjectService( final ProjectService projectService )
    {
        this.projectService = projectService;
    }
}


