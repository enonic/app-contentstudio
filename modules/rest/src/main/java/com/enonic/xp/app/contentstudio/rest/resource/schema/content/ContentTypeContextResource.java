package com.enonic.xp.app.contentstudio.rest.resource.schema.content;

import java.util.List;
import java.util.stream.Collectors;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.google.common.collect.ImmutableList;

import com.enonic.xp.app.contentstudio.json.schema.content.ContentTypeSummaryJson;
import com.enonic.xp.app.contentstudio.json.schema.content.ContentTypeSummaryListJson;
import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.app.contentstudio.rest.resource.schema.SchemaImageHelper;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.content.ContentTypes;
import com.enonic.xp.schema.mixin.MixinService;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.site.Site;
import com.enonic.xp.site.SiteConfig;
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

    private ContentTypeIconUrlResolver contentTypeIconUrlResolver;

    private ContentTypeIconResolver contentTypeIconResolver;

    private LocaleService localeService;

    private ContentService contentService;

    @GET
    @Path("byContent")
    public ContentTypeSummaryListJson byContent( @QueryParam("contentId") final String content )
    {
        final ContentId contentId = ContentId.from( content );
        final Site site = contentService.getNearestSite( contentId );

        final ContentTypes contentTypes;
        if ( site != null )
        {
            final List<ContentType> types = site.getSiteConfigs().stream().
                map( SiteConfig::getApplicationKey ).
                map( ( appKey ) -> contentTypeService.getByApplication( appKey ) ).
                flatMap( AbstractImmutableEntityList::stream ).
                collect( Collectors.toList() );
            contentTypes = ContentTypes.from( types );
        }
        else
        {
            contentTypes = ContentTypes.empty();
        }

        ImmutableList.Builder<ContentTypeSummaryJson> summariesJsonBuilder = new ImmutableList.Builder();

        contentTypes.forEach( type -> {
            summariesJsonBuilder.add( new ContentTypeSummaryJson( type, this.contentTypeIconUrlResolver,
                                                                  new LocaleMessageResolver( localeService,
                                                                                             type.getName().getApplicationKey() ) ) );
        } );

        return new ContentTypeSummaryListJson( summariesJsonBuilder.build() );
    }

    @Reference
    public void setContentTypeService( final ContentTypeService contentTypeService )
    {
        this.contentTypeService = contentTypeService;
        this.contentTypeIconResolver = new ContentTypeIconResolver( contentTypeService );
        this.contentTypeIconUrlResolver = new ContentTypeIconUrlResolver( this.contentTypeIconResolver );
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
