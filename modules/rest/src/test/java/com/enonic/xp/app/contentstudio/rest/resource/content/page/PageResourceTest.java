package com.enonic.xp.app.contentstudio.rest.resource.content.page;

import java.time.Instant;
import java.util.Collections;
import java.util.Locale;

import org.jboss.resteasy.core.ResteasyContext;
import org.junit.jupiter.api.Test;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.core.MediaType;

import com.enonic.xp.app.contentstudio.rest.resource.AdminResourceTestSupport;
import com.enonic.xp.app.contentstudio.rest.resource.content.JsonObjectsFactory;
import com.enonic.xp.branch.Branch;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentNotFoundException;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.FindContentIdsByParentResult;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.jaxrs.impl.MockRestResponse;
import com.enonic.xp.page.CreatePageParams;
import com.enonic.xp.page.Page;
import com.enonic.xp.page.PageRegions;
import com.enonic.xp.page.PageService;
import com.enonic.xp.page.PageTemplateKey;
import com.enonic.xp.page.UpdatePageParams;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.content.GetContentTypeParams;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.SecurityService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class PageResourceTest
    extends AdminResourceTestSupport
{
    private PageService pageService;

    private ContentService contentService;

    @Override
    protected Object getResourceInstance()
    {
        final ContentTypeService contentTypeService = mock( ContentTypeService.class );
        this.pageService = mock( PageService.class );
        this.contentService = mock( ContentService.class );

        final PageResource resource = new PageResource();
        resource.setPageService( pageService );

        when( contentTypeService.getByName( isA( GetContentTypeParams.class ) ) ).thenReturn(
            createContentType( "myapplication:my_type" ) );

        final SecurityService securityService = mock( SecurityService.class );

        final JsonObjectsFactory jsonObjectsFactory = new JsonObjectsFactory();
        jsonObjectsFactory.setContentTypeService( contentTypeService );
        jsonObjectsFactory.setSecurityService( securityService );
        jsonObjectsFactory.setContentService( contentService );
        resource.setJsonObjectsFactory( jsonObjectsFactory );

        final HttpServletRequest mockRequest = mock( HttpServletRequest.class );
        when( mockRequest.getServerName() ).thenReturn( "localhost" );
        when( mockRequest.getScheme() ).thenReturn( "http" );
        when( mockRequest.getServerPort() ).thenReturn( 80 );
        when( mockRequest.getLocales() ).thenReturn( Collections.enumeration( Collections.singleton( Locale.US ) ) );
        ResteasyContext.getContextDataMap().put( HttpServletRequest.class, mockRequest );

        return resource;
    }

    @Test
    public void update_page_success()
        throws Exception
    {
        final Content content = createPage( "content-id", "content-name", "myapplication:content-type" );

        when( this.pageService.update( isA( UpdatePageParams.class ) ) ).thenReturn( content );
        when( contentService.findIdsByParent( any() ) ).thenReturn( FindContentIdsByParentResult.create().build() );

        final String jsonString = request().path( "content/page/update" )
            .entity( readFromFile( "update_page_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        assertJson( "update_page_success.json", jsonString );
    }

    @Test
    public void update_page_failure()
        throws Exception
    {
        Content content = createPage( "content-id", "content-name", "myapplication:content-type" );

        when( this.pageService.update( isA( UpdatePageParams.class ) ) ).thenThrow(
            ContentNotFoundException.create().contentId( content.getId() ).build() );
        when( contentService.findIdsByParent( any() ) ).thenReturn( FindContentIdsByParentResult.create().build() );

        final MockRestResponse post = request().path( "content/page/update" )
            .entity( readFromFile( "update_page_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post();

        assertEquals( 500, post.getStatus() );
        assertEquals( "Content with id [content-id] not found", post.getAsString() );
    }

    @Test
    public void create_page_success()
        throws Exception
    {
        Content content = createPage( "content-id", "content-name", "myapplication:content-type" );

        when( this.pageService.create( isA( CreatePageParams.class ) ) ).thenReturn( content );
        when( contentService.findIdsByParent( any() ) ).thenReturn( FindContentIdsByParentResult.create().build() );

        String jsonString = request().path( "content/page/create" )
            .entity( readFromFile( "update_page_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        assertJson( "update_page_success.json", jsonString );
    }

    private Content createPage( final String id, final String name, final String contentTypeName )
    {
        PropertyTree rootDataSet = new PropertyTree();

        rootDataSet.addString( "property1", "value1" );

        Page page = Page.create()
            .template( PageTemplateKey.from( "my-page" ) )
            .config( rootDataSet )
            .regions( PageRegions.create().build() )
            .build();

        return Content.create()
            .id( ContentId.from( id ) )
            .path( ContentPath.from( "/" + name ) )
            .creator( PrincipalKey.from( "user:system:admin" ) )
            .owner( PrincipalKey.from( "user:myStore:me" ) )
            .valid( true )
            .language( Locale.ENGLISH )
            .displayName( "My Content" )
            .modifier( PrincipalKey.from( "user:system:admin" ) )
            .type( ContentTypeName.from( contentTypeName ) )
            .page( page )
            .build();
    }

    private ContentType createContentType( String name )
    {
        return ContentType.create()
            .superType( ContentTypeName.structured() )
            .displayName( "My type" )
            .name( name )
            .icon( Icon.from( new byte[]{123}, "image/gif", Instant.now() ) )
            .build();
    }
}
