package com.enonic.xp.app.contentstudio.rest.resource.content.page;

import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

import org.jboss.resteasy.core.ResteasyContext;
import org.junit.jupiter.api.Test;
import org.mockito.stubbing.Answer;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.core.MediaType;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.contentstudio.rest.resource.AdminResourceTestSupport;
import com.enonic.xp.app.contentstudio.rest.resource.content.JsonObjectsFactory;
import com.enonic.xp.branch.Branch;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentName;
import com.enonic.xp.content.ContentNotFoundException;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentPublishInfo;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.ExtraData;
import com.enonic.xp.core.impl.schema.content.BuiltinContentTypesAccessor;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.page.CreatePageTemplateParams;
import com.enonic.xp.descriptor.DescriptorKey;
import com.enonic.xp.page.Page;
import com.enonic.xp.page.PageRegions;
import com.enonic.xp.page.PageTemplate;
import com.enonic.xp.page.PageTemplateService;
import com.enonic.xp.page.PageTemplates;
import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeNames;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.content.GetContentTypeParams;
import com.enonic.xp.schema.xdata.XDataName;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.SecurityService;
import com.enonic.xp.site.Site;
import com.enonic.xp.site.SiteConfig;
import com.enonic.xp.site.SiteConfigs;
import com.enonic.xp.site.SiteDescriptor;
import com.enonic.xp.site.SiteService;
import com.enonic.xp.site.mapping.ControllerMappingDescriptor;
import com.enonic.xp.site.mapping.ControllerMappingDescriptors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class PageTemplateResourceTest
    extends AdminResourceTestSupport
{
    private PageTemplateService pageTemplateService;

    private ContentService contentService;

    private SiteService siteService;

    private ContentTypeService contentTypeService;

    private SecurityService securityService;

    private final String currentTime = "2013-08-23T12:55:09.162Z";

    Set<ContentType> knownContentTypes;

    @Override
    protected Object getResourceInstance()
    {
        contentTypeService = mock( ContentTypeService.class );

        knownContentTypes = new HashSet<>( BuiltinContentTypesAccessor.getAll() );

        lenient().when( contentTypeService.getByName(
            argThat( argument -> knownContentTypes.stream().anyMatch( ct -> ct.getName().equals( argument.getContentTypeName() ) ) ) ) )
            .thenAnswer( (Answer<ContentType>) invocation -> knownContentTypes.stream()
                .filter( ct -> ct.getName().equals( invocation.<GetContentTypeParams>getArgument( 0 ).getContentTypeName() ) )
                .findAny()
                .orElseThrow() );

        pageTemplateService = mock( PageTemplateService.class );
        securityService = mock( SecurityService.class );
        siteService = mock( SiteService.class );
        contentService = mock( ContentService.class );

        final JsonObjectsFactory jsonObjectsFactory = new JsonObjectsFactory();
        jsonObjectsFactory.setContentTypeService( contentTypeService );
        jsonObjectsFactory.setSecurityService( securityService );

        final PageTemplateResource resource = new PageTemplateResource();
        resource.setPageTemplateService( pageTemplateService );
        resource.setContentService( contentService );
        resource.setJsonObjectsFactory( jsonObjectsFactory );
        resource.setSiteService( siteService );
        return resource;
    }

    @Test
    public void isRenderableFalse()
        throws Exception
    {
        Content content = createContent( "83ac6e65-791b-4398-9ab5-ff5cab999036", "content-name", "myapplication:content-type" );
        when( this.contentService.getById( isA( ContentId.class ) ) ).thenReturn( content );

        String response = request().path( "content/page/template/isRenderable" ).
            queryParam( "contentId", content.getId().toString() ).
            get().getAsString();

        assertEquals( "false", response );
    }

    @Test
    public void isRenderableContentNotFound()
        throws Exception
    {
        Content content = createContent( "83ac6e65-791b-4398-9ab5-ff5cab999036", "content-name", "myapplication:content-type" );
        when( this.contentService.getById( isA( ContentId.class ) ) )
            .thenThrow( ContentNotFoundException.create().contentId( content.getId() ).build() );

        String response = request().path( "content/page/template/isRenderable" ).
            queryParam( "contentId", content.getId().toString() ).
            get().getAsString();

        assertEquals( "false", response );
    }

    @Test
    public void isRenderableFragment()
        throws Exception
    {
        Content content = createContent( "83ac6e65-791b-4398-9ab5-ff5cab999036", "content-name", ContentTypeName.fragment().toString() );
        when( this.contentService.getById( isA( ContentId.class ) ) ).thenReturn( content );

        String response = request().path( "content/page/template/isRenderable" ).
            queryParam( "contentId", content.getId().toString() ).
            get().getAsString();

        assertEquals( "true", response );
    }

    @Test
    public void isRenderablePageTemplate()
        throws Exception
    {
        PageTemplate pageTemplate =
            createPageTemplate( "88811414-9967-4f59-a76e-5de250441e50", "content-name", "myapplication:content-type" );
        when( contentService.getById( eq( pageTemplate.getId() ) ) ).thenReturn( pageTemplate );

        Site site = createSite( "8dcb8d39-e3be-4b2d-99dd-223666fc900c", "my-site", SiteConfigs.empty() );
        when( contentService.getNearestSite( eq( pageTemplate.getId() ) ) ).thenReturn( site );

        String response = request().path( "content/page/template/isRenderable" ).
            queryParam( "contentId", pageTemplate.getId().toString() ).
            get().getAsString();

        assertEquals( "true", response );
    }

    @Test
    public void isRenderablePageTemplateNoController()
        throws Exception
    {
        PageTemplate pageTemplate =
            createPageTemplate( "88811414-9967-4f59-a76e-5de250441e50", "content-name", "myapplication:content-type", null );
        when( contentService.getById( eq( pageTemplate.getId() ) ) ).thenReturn( pageTemplate );

        String response = request().path( "content/page/template/isRenderable" ).
            queryParam( "contentId", pageTemplate.getId().toString() ).
            get().getAsString();

        assertEquals( "false", response );
    }

    @Test
    public void isRenderableSupportedByPageTemplate()
        throws Exception
    {
        Content content = createContent( "83ac6e65-791b-4398-9ab5-ff5cab999036", "content-name", "myapplication:content-type" );
        when( contentService.getById( eq( content.getId() ) ) ).thenReturn( content );

        PageTemplate pageTemplate =
            createPageTemplate( "88811414-9967-4f59-a76e-5de250441e50", "content-name", "myapplication:content-type" );
        when( pageTemplateService.getBySite( isA( ContentId.class ) ) ).thenReturn( PageTemplates.from( pageTemplate ) );

        Site site = createSite( "8dcb8d39-e3be-4b2d-99dd-223666fc900c", "my-site", SiteConfigs.empty() );
        when( contentService.getNearestSite( eq( content.getId() ) ) ).thenReturn( site );

        String response = request().path( "content/page/template/isRenderable" ).
            queryParam( "contentId", content.getId().toString() ).
            get().getAsString();

        assertEquals( "true", response );
    }

    @Test
    public void isRenderableContentWithPageController()
        throws Exception
    {
        Content content =
            createContentWithPageController( "83ac6e65-791b-4398-9ab5-ff5cab999036", "content-name", "myapplication:content-type" );
        when( contentService.getById( eq( content.getId() ) ) ).thenReturn( content );

        Site site = createSite( "8dcb8d39-e3be-4b2d-99dd-223666fc900c", "my-site", SiteConfigs.empty() );
        when( contentService.getNearestSite( eq( content.getId() ) ) ).thenReturn( site );
        when( pageTemplateService.getBySite( isA( ContentId.class ) ) ).thenReturn( PageTemplates.empty() );

        String response = request().path( "content/page/template/isRenderable" ).
            queryParam( "contentId", content.getId().toString() ).
            get().getAsString();

        assertEquals( "true", response );
    }

    @Test
    public void isRenderableByControllerMapping()
        throws Exception
    {
        Content content = createContent( "83ac6e65-791b-4398-9ab5-ff5cab999036", "content-name", "myapplication:content-type" );
        when( contentService.getById( eq( content.getId() ) ) ).thenReturn( content );

        final SiteConfig siteConfig =
            SiteConfig.create().application( ApplicationKey.from( "myapplication" ) ).config( new PropertyTree() ).build();
        final SiteConfigs siteConfigs = SiteConfigs.from( siteConfig );
        Site site = createSite( "8dcb8d39-e3be-4b2d-99dd-223666fc900c", "my-site", siteConfigs );
        when( contentService.getNearestSite( eq( content.getId() ) ) ).thenReturn( site );
        when( pageTemplateService.getBySite( isA( ContentId.class ) ) ).thenReturn( PageTemplates.empty() );
        final ControllerMappingDescriptor mapingDescriptor = ControllerMappingDescriptor.create().
            contentConstraint( "type:'.*:content-type'" ).
            controller( ResourceKey.from( "myapplication:/some/path" ) ).
            build();
        final SiteDescriptor siteDescriptor =
            SiteDescriptor.create().mappingDescriptors( ControllerMappingDescriptors.from( mapingDescriptor ) ).build();
        when( siteService.getDescriptor( isA( ApplicationKey.class ) ) ).thenReturn( siteDescriptor );

        String response = request().path( "content/page/template/isRenderable" ).
            queryParam( "contentId", content.getId().toString() ).
            get().getAsString();

        assertEquals( "true", response );
    }

    @Test
    public void createPageTemplateWithExistingPathShouldIncrementCounter()
        throws Exception
    {
        final HttpServletRequest mockRequest = mock( HttpServletRequest.class );
        when( mockRequest.getServerName() ).thenReturn( "localhost" );
        when( mockRequest.getScheme() ).thenReturn( "http" );
        when( mockRequest.getServerPort() ).thenReturn( 80 );
        when( mockRequest.getLocales() ).thenReturn( Collections.enumeration( Collections.singleton( Locale.US ) ) );
        ResteasyContext.getContextDataMap().put( HttpServletRequest.class, mockRequest );

        ContentPath templatePath = ContentPath.from( "myapplication/_templates/template-myapplication" );
        ContentPath templatePath1 = ContentPath.from( "myapplication/_templates/template-myapplication-1" );
        ContentPath templatePath2 = ContentPath.from( "myapplication/_templates/template-myapplication-2" );
        when( contentService.contentExists( eq( templatePath ) ) ).thenReturn( true );
        when( contentService.contentExists( eq( templatePath1 ) ) ).thenReturn( true );
        when( contentService.contentExists( eq( templatePath2 ) ) ).thenReturn( false );

        PageTemplate template = createPageTemplate( "template-id", "template-myapplication-2", "myapplication:content-type" );
        when( pageTemplateService.create( argThat(
            ( CreatePageTemplateParams params ) -> ContentName.from( "template-myapplication-2" ).equals( params.getName() ) ) ) )
            .thenReturn( template );

        String response = request().path( "content/page/template/create" ).
            entity( readFromFile( "create_template_params.json" ), MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

        assertJson( "create_template_success.json", response );
    }

    private PageTemplate createPageTemplate( final String id, final String name, final String canRender, final DescriptorKey controller )
    {
        final PropertyTree data = new PropertyTree();
        data.addString( "supports", canRender );

        final Page page = Page.create().
            descriptor( controller ).
            config( new PropertyTree() ).
            regions( PageRegions.create().build() ).
            build();

        return PageTemplate.newPageTemplate().
            canRender( ContentTypeNames.from( canRender ) ).
            id( ContentId.from( id ) ).
            name( name ).
            displayName( "My page template" ).
            owner( PrincipalKey.from( "user:myStore:me" ) ).
            data( data ).
            type( ContentTypeName.pageTemplate() ).
            parentPath( ContentPath.from( "/site/_templates" ) ).
            page( page ).
            build();

    }

    private PageTemplate createPageTemplate( final String id, final String name, final String canRender )
    {
        return createPageTemplate( id, name, canRender, DescriptorKey.from( "my-descriptor" ) );
    }

    private Content createContent( final String id, final ContentPath parentPath, final String name, final String contentTypeName )
    {
        final PropertyTree metadata = new PropertyTree();
        metadata.setLong( "myProperty", 1L );

        return Content.create().
            id( ContentId.from( id ) ).
            parentPath( parentPath ).
            name( name ).
            valid( true ).
            createdTime( Instant.parse( this.currentTime ) ).
            creator( PrincipalKey.from( "user:system:admin" ) ).
            owner( PrincipalKey.from( "user:myStore:me" ) ).
            language( Locale.ENGLISH ).
            displayName( "My Content" ).
            modifiedTime( Instant.parse( this.currentTime ) ).
            modifier( PrincipalKey.from( "user:system:admin" ) ).
            type( ContentTypeName.from( contentTypeName ) ).
            addExtraData( new ExtraData( XDataName.from( "myApplication:myField" ), metadata ) ).
            publishInfo( ContentPublishInfo.create().
                from( Instant.parse( "2016-11-02T10:36:00Z" ) ).
                to( Instant.parse( "2016-11-22T10:36:00Z" ) ).
                first( Instant.parse( "2016-11-02T10:36:00Z" ) ).
                build() ).
            build();
    }

    private Content createContent( final String id, final String name, final String contentTypeName )
    {
        return this.createContent( id, ContentPath.ROOT, name, contentTypeName );
    }

    private Content createContentWithPageController( final String id, final String name, final String contentTypeName )
    {
        final Content content = this.createContent( id, ContentPath.ROOT, name, contentTypeName );
        final Page page = Page.create().
            descriptor( DescriptorKey.from( "my-descriptor" ) ).
            config( new PropertyTree() ).
            regions( PageRegions.create().build() ).
            build();
        return Content.create( content ).page( page ).build();
    }

    private Site createSite( final String id, final String name, SiteConfigs siteConfigs )
    {
        return Site.create().
            siteConfigs( siteConfigs ).
            id( ContentId.from( id ) ).
            parentPath( ContentPath.ROOT ).
            name( name ).
            valid( true ).
            createdTime( Instant.parse( this.currentTime ) ).
            creator( PrincipalKey.from( "user:system:admin" ) ).
            owner( PrincipalKey.from( "user:myStore:me" ) ).
            language( Locale.ENGLISH ).
            displayName( "My Content" ).
            modifiedTime( Instant.parse( this.currentTime ) ).
            modifier( PrincipalKey.from( "user:system:admin" ) ).
            type( ContentTypeName.site() ).
            build();
    }
}
