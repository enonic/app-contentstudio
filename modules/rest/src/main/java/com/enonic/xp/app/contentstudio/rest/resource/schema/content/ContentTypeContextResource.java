package com.enonic.xp.app.contentstudio.rest.resource.schema.content;

import java.util.List;
import java.util.stream.Collectors;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.google.common.collect.ImmutableList;

import jakarta.annotation.security.RolesAllowed;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;

import com.enonic.xp.app.contentstudio.json.schema.content.ContentTypeSummaryJson;
import com.enonic.xp.app.contentstudio.json.schema.content.ContentTypeSummaryListJson;
import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.content.ContentTypes;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.site.Site;
import com.enonic.xp.site.SiteConfig;
import com.enonic.xp.site.SiteConfigsDataSerializer;
import com.enonic.xp.support.AbstractImmutableEntityList;

import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.CONTENT_CMS_PATH;

@Path(ResourceConstants.REST_ROOT + "{content:(" + CONTENT_CMS_PATH + ")}/schema/content")
@Produces("application/json")
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class ContentTypeContextResource
    implements JaxRsComponent
{
    private ContentTypeService contentTypeService;

    private LocaleService localeService;

    private ContentService contentService;

    @GET
    @Path("byContent")
    public ContentTypeSummaryListJson byContent( @QueryParam("contentId") final String content, @Context HttpServletRequest request )
    {
        final ContentId contentId = ContentId.from( content );
        final Site site = contentService.getNearestSite( contentId );

        final ContentTypes contentTypes;
        if ( site != null )
        {
            final List<ContentType> types = SiteConfigsDataSerializer.fromData( site.getData().getRoot() )
                .stream()
                .map( SiteConfig::getApplicationKey )
                .map( ( appKey ) -> contentTypeService.getByApplication( appKey ) )
                .flatMap( AbstractImmutableEntityList::stream )
                .collect( Collectors.toList() );
            contentTypes = ContentTypes.from( types );
        }
        else
        {
            contentTypes = ContentTypes.empty();
        }

        final ContentTypeIconUrlResolver contentTypeIconUrlResolver =
            new ContentTypeIconUrlResolver( new ContentTypeIconResolver( contentTypeService ), request );

        ImmutableList.Builder<ContentTypeSummaryJson> summariesJsonBuilder = new ImmutableList.Builder();

        contentTypes.forEach( type -> {
            summariesJsonBuilder.add( new ContentTypeSummaryJson( type, contentTypeIconUrlResolver,
                                                                  new LocaleMessageResolver( localeService,
                                                                                             type.getName().getApplicationKey(),
                                                                                             request.getLocales() ), request ) );
        } );

        return new ContentTypeSummaryListJson( summariesJsonBuilder.build() );
    }

    @Reference
    public void setContentTypeService( final ContentTypeService contentTypeService )
    {
        this.contentTypeService = contentTypeService;
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
}
