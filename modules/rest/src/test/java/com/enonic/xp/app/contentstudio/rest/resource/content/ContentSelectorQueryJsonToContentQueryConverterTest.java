package com.enonic.xp.app.contentstudio.rest.resource.content;

import com.enonic.xp.app.ApplicationWildcardMatcher;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentSelectorQueryJson;
import com.enonic.xp.content.*;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.schema.content.*;
import com.enonic.xp.schema.xdata.XDataName;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.site.Site;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class ContentSelectorQueryJsonToContentQueryConverterTest
{

    private ContentService contentService;

    private ContentTypeService contentTypeService;

    private final String currentTime = "2013-08-23T12:55:09.162Z";

    @BeforeEach
    public void setUp()
    {
        contentService = Mockito.mock( ContentService.class );
        contentTypeService = Mockito.mock( ContentTypeService.class );
    }

    @Test
    public void testSelectorQueryWithFewAllowPaths()
    {
        Mockito.when( contentTypeService.getAll() ).thenReturn( ContentTypes.from( createContentType( "myApplication:comment" ) ) );

        final Content content = createContent( "content-id", "my-content", ContentTypeName.folder() );

        Mockito.when( contentService.getById( Mockito.isA( ContentId.class ) ) ).thenReturn( content );

        final List<String> contentTypeNames = new ArrayList();
        contentTypeNames.add( "myApplication:comment" );

        final List<String> allowPaths = new ArrayList();
        allowPaths.add( "*" );
        allowPaths.add( "/path/to/parent" );

        ContentSelectorQueryJson contentQueryJson =
            new ContentSelectorQueryJson( "", 0, 100, "summary", "contentId", "inputName", contentTypeNames, allowPaths, "testapp" );
        ContentSelectorQueryJsonToContentQueryConverter processor = ContentSelectorQueryJsonToContentQueryConverter.create()
            .contentQueryJson( contentQueryJson )
            .contentService( contentService )
            .contentTypeService( contentTypeService )
            .contentTypeParseMode( ApplicationWildcardMatcher.Mode.MATCH )
            .build();

        final ContentQuery contentQuery = processor.createQuery();

        assertEquals( 0, contentQuery.getFrom() );
        assertEquals( 100, contentQuery.getSize() );
        assertEquals( ContentTypeNames.from( "myApplication:comment" ), contentQuery.getContentTypes() );
        assertEquals( "(_path LIKE '/content/*' OR _path LIKE '/content/path/to/parent*')", contentQuery.getQueryExpr().toString() );
    }

    @Test
    public void testPathsWithSiteResolved()
    {
        final Content content = createContent( "content-id", "my-content", ContentTypeName.folder() );

        final Site site = createSite( "site-id", "my-site" );

        final List<String> allowPaths = new ArrayList();
        allowPaths.add( "${site}/path1" );
        allowPaths.add( "${site}/path2/path3" );
        allowPaths.add( "parent-path/child-path" );

        Mockito.when( contentService.getById( Mockito.isA( ContentId.class ) ) ).thenReturn( content );

        Mockito.when( contentService.getNearestSite( Mockito.isA( ContentId.class ) ) ).thenReturn( site );

        ContentSelectorQueryJson contentQueryJson =
            new ContentSelectorQueryJson( "", 0, 100, "summary", "contentId", "inputName", Collections.emptyList(), allowPaths,
                                          null );
        ContentSelectorQueryJsonToContentQueryConverter processor = ContentSelectorQueryJsonToContentQueryConverter.create()
            .contentQueryJson( contentQueryJson )
            .contentService( contentService )
            .contentTypeService( contentTypeService )
            .contentTypeParseMode( ApplicationWildcardMatcher.Mode.MATCH )
            .build();

        final ContentQuery contentQuery = processor.createQuery();

        assertEquals( 0, contentQuery.getFrom() );
        assertEquals( 100, contentQuery.getSize() );
        assertEquals(
            "((_path LIKE '/content/my-site/path1*' OR _path LIKE '/content/my-site/path2/path3*') OR _path LIKE '/content/parent-path/child-path*')",
            contentQuery.getQueryExpr().toString() );
    }

    @Test
    public void testPathWithAllowTypePassedFromJson()
    {
        Mockito.when( contentTypeService.getAll() )
            .thenReturn( ContentTypes.from( createContentType( "myApplication:type1" ), createContentType( "myApplication:type2" ) ) );

        final Content content = createContent( "content-id", "my-content", ContentTypeName.shortcut() );

        final List<String> allowPaths = new ArrayList();
        allowPaths.add( "parent-path/child-path" );

        Mockito.when( contentService.getById( Mockito.isA( ContentId.class ) ) ).thenReturn( content );

        final List<String> allowTypesFromJson = Arrays.asList( "myApplication:type1", "myApplication:type2", "myApplication:type2" );

        ContentSelectorQueryJson contentQueryJson =
            new ContentSelectorQueryJson( "", 0, 100, "summary", "contentId", "inputName", allowTypesFromJson, allowPaths, null );
        ContentSelectorQueryJsonToContentQueryConverter processor = ContentSelectorQueryJsonToContentQueryConverter.create()
            .contentQueryJson( contentQueryJson )
            .contentService( contentService )
            .contentTypeService( contentTypeService )
            .contentTypeParseMode( ApplicationWildcardMatcher.Mode.MATCH )
            .build();

        final ContentQuery contentQuery = processor.createQuery();

        assertEquals( 0, contentQuery.getFrom() );
        assertEquals( 100, contentQuery.getSize() );
        assertEquals( ContentTypeNames.from( "myApplication:type1", "myApplication:type2", "myApplication:type2" ),
                      contentQuery.getContentTypes() );
        assertEquals( "_path LIKE '/content/parent-path/child-path*'", contentQuery.getQueryExpr().toString() );
    }

    @Test
    public void testNullSiteResolved()
    {
        final Content content = createContent( "content-id", "my-content", ContentTypeName.shortcut() );

        final List<String> allowPaths = new ArrayList<>();
        allowPaths.add( "${site}/*" );

        Mockito.when( contentService.getById( Mockito.isA( ContentId.class ) ) ).thenReturn( content );

        Mockito.when( contentService.getNearestSite( Mockito.isA( ContentId.class ) ) ).thenReturn( null );

        ContentSelectorQueryJson contentQueryJson =
            new ContentSelectorQueryJson( "", 0, 100, "summary", "contentId", "inputName", Collections.emptyList(), allowPaths,
                                          "testapp" );
        ContentSelectorQueryJsonToContentQueryConverter processor = ContentSelectorQueryJsonToContentQueryConverter.create()
            .contentQueryJson( contentQueryJson )
            .contentService( contentService )
            .contentTypeParseMode( ApplicationWildcardMatcher.Mode.MATCH )
            .build();

        final ContentQuery contentQuery = processor.createQuery();
        assertEquals( "_path LIKE '/content/*'", contentQuery.getQueryExpr().toString() );
    }

    @Test
    public void testQueryWithSearchAndNoPaths()
    {
        final Content content = createContent( "content-id", "my-content", ContentTypeName.media() );

        Mockito.when( contentService.getById( Mockito.isA( ContentId.class ) ) ).thenReturn( content );

        ContentSelectorQueryJson contentQueryJson = new ContentSelectorQueryJson(
            "(fulltext('displayName^5,_name^3,_alltext', 'check', 'AND') OR ngram('displayName^5,_name^3,_alltext', 'check', 'AND')) " +
                "ORDER BY _modifiedTime DESC", 0, 100, "summary", "contentId", "inputName", Collections.emptyList(),
            Collections.emptyList(),  null );
        ContentSelectorQueryJsonToContentQueryConverter processor = getProcessor( contentQueryJson );

        final ContentQuery contentQuery = processor.createQuery();

        assertEquals( 0, contentQuery.getFrom() );
        assertEquals( 100, contentQuery.getSize() );
        assertEquals(
            "(fulltext('displayName^5,_name^3,_alltext', 'check', 'AND') OR ngram('displayName^5,_name^3,_alltext', 'check', 'AND')) ORDER BY _modifiedtime DESC",
            contentQuery.getQueryExpr().toString() );
    }

    private ContentSelectorQueryJsonToContentQueryConverter getProcessor( final ContentSelectorQueryJson json )
    {
        return ContentSelectorQueryJsonToContentQueryConverter.create()
            .contentQueryJson( json )
            .contentService( contentService )
            .contentTypeService( contentTypeService )
            .contentTypeParseMode( ApplicationWildcardMatcher.Mode.MATCH )
            .build();
    }

    @Test
    public void testQueryWithSearch()
    {
        Mockito.when( contentTypeService.getAll() ).thenReturn( ContentTypes.from( createContentType( "myApplication:comment" ) ) );

        final Content content = createContent( "content-id", "my-content", ContentTypeName.shortcut() );

        final List<String> allowPaths = new ArrayList();
        allowPaths.add( "/*" );

        final List<String> contentTypeNames = new ArrayList();
        contentTypeNames.add( "myApplication:comment" );

        Mockito.when( contentService.getById( Mockito.isA( ContentId.class ) ) ).thenReturn( content );

        ContentSelectorQueryJson contentQueryJson = new ContentSelectorQueryJson(
            "(fulltext('displayName^5,_name^3,_alltext', 'check', 'AND') OR ngram('displayName^5,_name^3,_alltext', 'check', 'AND')) " +
                "ORDER BY _modifiedTime DESC", 0, 100, "summary", "contentId", "inputName", contentTypeNames, allowPaths, null );
        ContentSelectorQueryJsonToContentQueryConverter processor = getProcessor( contentQueryJson );

        final ContentQuery contentQuery = processor.createQuery();

        assertEquals( 0, contentQuery.getFrom() );
        assertEquals( 100, contentQuery.getSize() );
        assertEquals( ContentTypeNames.from( "myApplication:comment" ), contentQuery.getContentTypes() );
        assertEquals( "(_path LIKE '/content/*' AND (fulltext('displayName^5,_name^3,_alltext', 'check', 'AND') " +
                          "OR ngram('displayName^5,_name^3,_alltext', 'check', 'AND'))) ORDER BY _modifiedtime DESC",
                      contentQuery.getQueryExpr().toString() );
    }

    @Test
    public void testNoContentAndNoAppKey()
    {
        Mockito.when( contentTypeService.getAll() ).thenReturn( ContentTypes.from( createContentType( "myApplication:comment" ) ) );

        final List<String> allowPaths = new ArrayList();
        allowPaths.add( "${site}/path1" );

        final List<String> contentTypeNames = new ArrayList();
        contentTypeNames.add( "myApplication:comment" );

        ContentSelectorQueryJson contentQueryJson = new ContentSelectorQueryJson(
            "(fulltext('displayName^5,_name^3,_alltext', 'check', 'AND') OR ngram('displayName^5,_name^3,_alltext', 'check', 'AND')) " +
                "ORDER BY _modifiedTime DESC", 0, 100, "summary", "contentId", "inputName", contentTypeNames, allowPaths,  null );
        ContentSelectorQueryJsonToContentQueryConverter processor = getProcessor( contentQueryJson );

        final ContentQuery contentQuery = processor.createQuery();

        assertEquals( 0, contentQuery.getFrom() );
        assertEquals( 100, contentQuery.getSize() );
        assertEquals( ContentTypeNames.from( "myApplication:comment" ), contentQuery.getContentTypes() );
        assertEquals( "(_path LIKE '/content/path1*' AND (fulltext('displayName^5,_name^3,_alltext', 'check', 'AND') " +
                          "OR ngram('displayName^5,_name^3,_alltext', 'check', 'AND'))) ORDER BY _modifiedtime DESC",
                      contentQuery.getQueryExpr().toString() );
    }

    private Content createContent( final String id, final String name, final ContentTypeName contentTypeName )
    {
        final PropertyTree metadata = new PropertyTree();

        final Content parent1 = Content.create()
            .id( ContentId.from( id ) )
            .parentPath( ContentPath.ROOT )
            .name( "parent-content-1" )
            .valid( true )
            .createdTime( Instant.parse( this.currentTime ) )
            .creator( PrincipalKey.from( "user:system:admin" ) )
            .owner( PrincipalKey.from( "user:myStore:me" ) )
            .language( Locale.ENGLISH )
            .displayName( "My Content" )
            .modifiedTime( Instant.parse( this.currentTime ) )
            .modifier( PrincipalKey.from( "user:system:admin" ) )
            .type( contentTypeName )
            .addExtraData( new ExtraData( XDataName.from( "myApplication:myField" ), metadata ) )
            .build();

        final Content parent2 = Content.create()
            .id( ContentId.from( id ) )
            .parentPath( parent1.getPath() )
            .name( "parent-content-2" )
            .valid( true )
            .createdTime( Instant.parse( this.currentTime ) )
            .creator( PrincipalKey.from( "user:system:admin" ) )
            .owner( PrincipalKey.from( "user:myStore:me" ) )
            .language( Locale.ENGLISH )
            .displayName( "My Content" )
            .modifiedTime( Instant.parse( this.currentTime ) )
            .modifier( PrincipalKey.from( "user:system:admin" ) )
            .type( contentTypeName )
            .addExtraData( new ExtraData( XDataName.from( "myApplication:myField" ), metadata ) )
            .build();

        return Content.create()
            .id( ContentId.from( id ) )
            .parentPath( parent2.getPath() )
            .name( name )
            .valid( true )
            .createdTime( Instant.parse( this.currentTime ) )
            .creator( PrincipalKey.from( "user:system:admin" ) )
            .owner( PrincipalKey.from( "user:myStore:me" ) )
            .language( Locale.ENGLISH )
            .displayName( "My Content" )
            .modifiedTime( Instant.parse( this.currentTime ) )
            .modifier( PrincipalKey.from( "user:system:admin" ) )
            .type( contentTypeName )
            .addExtraData( new ExtraData( XDataName.from( "myApplication:myField" ), metadata ) )
            .build();
    }

    private Site createSite( final String id, final String name )
    {
        return Site.create()
            .id( ContentId.from( id ) )
            .parentPath( ContentPath.ROOT )
            .name( name )
            .valid( true )
            .createdTime( Instant.parse( this.currentTime ) )
            .creator( PrincipalKey.from( "user:system:admin" ) )
            .owner( PrincipalKey.from( "user:myStore:me" ) )
            .language( Locale.ENGLISH )
            .displayName( "My Content" )
            .modifiedTime( Instant.parse( this.currentTime ) )
            .modifier( PrincipalKey.from( "user:system:admin" ) )
            .type( ContentTypeName.site() )
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
