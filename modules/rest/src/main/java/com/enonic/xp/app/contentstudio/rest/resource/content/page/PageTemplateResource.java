package com.enonic.xp.app.contentstudio.rest.resource.content.page;

import java.io.IOException;
import java.util.function.Predicate;

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

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.app.contentstudio.json.content.ContentJson;
import com.enonic.xp.app.contentstudio.json.content.ContentListJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.JsonObjectsFactory;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.app.contentstudio.rest.resource.content.ContentListMetaData;
import com.enonic.xp.content.ContentName;
import com.enonic.xp.content.ContentNotFoundException;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.name.NamePrettyfier;
import com.enonic.xp.page.CreatePageTemplateParams;
import com.enonic.xp.page.GetDefaultPageTemplateParams;
import com.enonic.xp.page.Page;
import com.enonic.xp.page.PageTemplate;
import com.enonic.xp.page.PageTemplateFilter;
import com.enonic.xp.page.PageTemplateKey;
import com.enonic.xp.page.PageTemplateService;
import com.enonic.xp.page.PageTemplates;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.site.Site;
import com.enonic.xp.site.SiteService;

import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.CONTENT_CMS_PATH;
import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.REST_ROOT;


@Path(REST_ROOT + "{content:(content|" + CONTENT_CMS_PATH + "/content)}/page/template")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class PageTemplateResource
    implements JaxRsComponent
{
    private PageTemplateService pageTemplateService;

    private ContentService contentService;

    private SiteService siteService;

    private JsonObjectsFactory jsonObjectsFactory;

    @GET
    public ContentJson getByKey( @QueryParam("key") final String pageTemplateKeyAsString, @Context HttpServletRequest request )
        throws IOException
    {
        final PageTemplateKey pageTemplateKey = PageTemplateKey.from( pageTemplateKeyAsString );
        final PageTemplate pageTemplate = pageTemplateService.getByKey( pageTemplateKey );
        return jsonObjectsFactory.createContentJson( pageTemplate, request );
    }

    @GET
    @Path("list")
    public ContentListJson<ContentJson> list( @QueryParam("siteId") String siteIdAsString, @Context HttpServletRequest request )
    {

        final ContentId siteId = ContentId.from( siteIdAsString );
        final PageTemplates pageTemplates = pageTemplateService.getBySite( siteId );

        final ContentListMetaData metaData =
            ContentListMetaData.create().totalHits( pageTemplates.getSize() ).hits( pageTemplates.getSize() ).build();
        return new ContentListJson<>( pageTemplates.toContents(), metaData,
                                      c -> jsonObjectsFactory.createContentJson( c, request ) );
    }

    @GET
    @Path("listByCanRender")
    public ContentListJson<ContentJson> listByCanRender( @QueryParam("siteId") String siteIdAsString,
                                                         @QueryParam("contentTypeName") String contentTypeName,
                                                         @Context HttpServletRequest request )
    {
        final ContentId siteId = ContentId.from( siteIdAsString );
        final PageTemplates pageTemplates = pageTemplateService.getBySite( siteId );
        final Predicate<PageTemplate> spec = PageTemplateFilter.canRender( ContentTypeName.from( contentTypeName ) );
        final PageTemplates filteredPageTemplates = pageTemplates.filter( spec );
        final ContentListMetaData metaData =
            ContentListMetaData.create().totalHits( filteredPageTemplates.getSize() ).hits( filteredPageTemplates.getSize() ).build();
        return new ContentListJson<>( filteredPageTemplates.toContents(), metaData,
                                      c -> jsonObjectsFactory.createContentJson( c, request ) );
    }

    @GET
    @Path("default")
    public ContentJson getDefault( @QueryParam("siteId") String siteIdAsString,
                                   @QueryParam("contentTypeName") String contentTypeNameAsString,
                                   @Context HttpServletRequest request )
    {
        final ContentId siteId = ContentId.from( siteIdAsString );
        final ContentTypeName contentTypeName = ContentTypeName.from( contentTypeNameAsString );
        final PageTemplate pageTemplate = pageTemplateService.getDefault( GetDefaultPageTemplateParams.create().
            site( siteId ).
            contentType( contentTypeName ).
            build() );
        if ( pageTemplate == null )
        {
            return null;
        }
        return jsonObjectsFactory.createContentJson( pageTemplate, request );
    }

    @GET
    @Path("isRenderable")
    public boolean isRenderable( @QueryParam("contentId") String contentIdAsString )
    {
        final ContentId contentId = ContentId.from( contentIdAsString );
        try
        {
            final Content content = this.contentService.getById( contentId );
            if ( content.getType().isFragment() )
            {
                return true;
            }

            final Site nearestSite = this.contentService.getNearestSite( contentId );

            if ( nearestSite != null )
            {
                if ( content.isPageTemplate() )
                {
                    return ( (PageTemplate) content ).getController() != null;
                }

                final ContentId siteId = nearestSite.getId();
                final PageTemplates pageTemplates = pageTemplateService.getBySite( siteId );

                for ( final PageTemplate pageTemplate : pageTemplates )
                {
                    if ( pageTemplate.canRender( content.getType() ) && pageTemplate.getPage() != null )
                    {
                        return true;
                    }
                }

                final Page page = content.getPage();
                if ( page != null && page.hasDescriptor() )
                {
                    return true;
                }

                return new ControllerMappingsResolver( siteService ).canRender( content, nearestSite );
            }
            return false;
        }
        catch ( ContentNotFoundException e )
        {
            return false;
        }
    }

    @POST
    @Path("create")
    @Consumes(MediaType.APPLICATION_JSON)
    public ContentJson create( final CreatePageTemplateJson params, @Context HttpServletRequest request )
    {
        CreatePageTemplateParams templateParams = params.getCreateTemplate();

        templateParams.name( ensureUniqueName( templateParams.getSite(), templateParams.getName() ) );

        PageTemplate template = this.pageTemplateService.create( templateParams );
        return jsonObjectsFactory.createContentJson( template, request );
    }

    private ContentName ensureUniqueName( ContentPath parent, ContentName name )
    {
        String baseName = name.toString();
        String currentName = baseName;
        int counter = 1;
        while ( this.contentService.contentExists( ContentPath.from( ContentPath.from( parent, "_templates" ), currentName ) ) )
        {
            currentName = NamePrettyfier.create( baseName + "-" + counter++ );
        }
        return ContentName.from( currentName );
    }

    @Reference
    public void setPageTemplateService( final PageTemplateService pageTemplateService )
    {
        this.pageTemplateService = pageTemplateService;
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
    public void setJsonObjectsFactory( final JsonObjectsFactory jsonObjectsFactory )
    {
        this.jsonObjectsFactory = jsonObjectsFactory;
    }
}
