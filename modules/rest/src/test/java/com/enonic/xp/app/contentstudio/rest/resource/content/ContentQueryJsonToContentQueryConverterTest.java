package com.enonic.xp.app.contentstudio.rest.resource.content;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentQueryJson;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentIds;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentQuery;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.Contents;
import com.enonic.xp.content.GetContentByIdsParams;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.query.expr.DslExpr;
import com.enonic.xp.query.expr.DslOrderExpr;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeNames;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.util.Reference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class ContentQueryJsonToContentQueryConverterTest
{

    private ContentService contentService;

    @BeforeEach
    public void setUp()
    {
        contentService = Mockito.mock( ContentService.class );
    }

    @Test
    public void testSelectorQueryWithContentTypes()
    {
        final List<String> contentTypeNames = new ArrayList();
        contentTypeNames.add( "myApplication:comment" );
        contentTypeNames.add( "myApplication:site" );

        final ContentQueryJson contentQueryJson =
            new ContentQueryJson( "", 0, 100, contentTypeNames, null, "summary", null, null, new HashMap<>(), new ArrayList<>(),
                                  ContentConstants.BRANCH_DRAFT.getValue() );
        final ContentQueryJsonToContentQueryConverter processor =
            ContentQueryJsonToContentQueryConverter.create().contentQueryJson( contentQueryJson ).contentService( contentService ).build();

        final ContentQuery contentQuery = processor.createQuery();

        assertEquals( 0, contentQuery.getFrom() );
        assertEquals( 100, contentQuery.getSize() );
        assertEquals( ContentTypeNames.from( "myApplication:comment", "myApplication:site" ), contentQuery.getContentTypes() );
    }

    @Test
    public void testOutboundContentIdsQuery()
    {
        final PropertyTree data = new PropertyTree();
        final Content folderRefContent1 = createContent( "folderRefContent1", data, ContentTypeName.folder() );
        final Content folderRefContent2 = createContent( "folderRefContent2", data, ContentTypeName.folder() );

        data.addReference( "myRef1", Reference.from( folderRefContent1.getId().toString() ) );
        data.addReference( "myRef2", Reference.from( folderRefContent2.getId().toString() ) );

        final Content content = createContent( "content", data, ContentTypeName.site() );

        Mockito.when( contentService.getByIds( Mockito.any() ) ).thenReturn( Contents.from( folderRefContent1, folderRefContent2 ) );
        Mockito.when( contentService.getById( content.getId() ) ).thenReturn( content );

        Mockito.when( contentService.getOutboundDependencies( content.getId() ) )
            .thenReturn( ContentIds.from( folderRefContent1.getId(), folderRefContent2.getId() ) );

        final ContentQueryJson contentQueryJson =
            new ContentQueryJson( "", 0, 100, new ArrayList(), content.getId().toString(), "summary", null, null, new HashMap<>(),
                                  new ArrayList<>(), ContentConstants.BRANCH_DRAFT.getValue() );

        ContentQueryJsonToContentQueryConverter processor =
            ContentQueryJsonToContentQueryConverter.create().contentQueryJson( contentQueryJson ).contentService( contentService ).build();

        final ContentQuery contentQuery = processor.createQuery();

        assertEquals( 0, contentQuery.getFrom() );
        assertEquals( 100, contentQuery.getSize() );
        assertEquals( contentQuery.getFilterContentIds(), ContentIds.from( folderRefContent1.getId(), folderRefContent2.getId() ) );
    }

    @Test
    public void testEmptyOutboundContentIds_query_is_null()
    {
        final Content content = createContent( "content", new PropertyTree(), ContentTypeName.site() );

        Mockito.when( contentService.getOutboundDependencies( content.getId() ) ).thenReturn( ContentIds.empty() );

        final ContentQueryJson contentQueryJson =
            new ContentQueryJson( "", 0, 100, new ArrayList(), content.getId().toString(), "summary", null, null, new HashMap<>(),
                                  new ArrayList<>(), ContentConstants.BRANCH_DRAFT.getValue() );

        Mockito.when( contentService.getById( content.getId() ) ).thenReturn( content );
        Mockito.when( contentService.getByIds( new GetContentByIdsParams( ContentIds.empty() ) ) ).thenReturn( Contents.empty() );

        ContentQueryJsonToContentQueryConverter processor =
            ContentQueryJsonToContentQueryConverter.create().contentQueryJson( contentQueryJson ).contentService( contentService ).build();

        final ContentQuery contentQuery = processor.createQuery();

        assertNull( contentQuery );
    }

    @Test
    public void testInboundContentsQuery()
    {
        final ContentQueryJson contentQueryJson = new ContentQueryJson(
            "((fulltext('displayName^5,_name^3,_alltext', '', 'AND') OR ngram('displayName^5,_name^3,_alltext', '', 'AND')) AND inboundDependencies('_references', 'test-content-id'))",
            0, 100, new ArrayList(), null, "summary", null, null, null, null, ContentConstants.BRANCH_DRAFT.getValue() );

        final ContentQueryJsonToContentQueryConverter processor = getProcessor( contentQueryJson );

        final ContentQuery contentQuery = processor.createQuery();

        assertEquals( 0, contentQuery.getFrom() );
        assertEquals( 100, contentQuery.getSize() );
        assertEquals(
            "((fulltext('displayName^5,_name^3,_alltext', '', 'AND') OR ngram('displayName^5,_name^3,_alltext', '', 'AND')) AND inboundDependencies('_references', 'test-content-id'))",
            contentQuery.getQueryExpr().toString() );
    }

    private ContentQueryJsonToContentQueryConverter getProcessor( final ContentQueryJson json )
    {
        return ContentQueryJsonToContentQueryConverter.create().contentQueryJson( json ).contentService( contentService ).build();
    }

    @Test
    public void testQueryWithSearch()
    {
        final List<String> contentTypeNames = new ArrayList();
        contentTypeNames.add( "myApplication:comment" );

        ContentQueryJson contentQueryJson = new ContentQueryJson(
            "(fulltext('displayName^5,_name^3,_alltext', 'check', 'AND') OR ngram('displayName^5,_name^3,_alltext', 'check', 'AND')) " +
                "ORDER BY _modifiedTime DESC", 0, 100, contentTypeNames, null, "summary", null, null, null, null,
            ContentConstants.BRANCH_DRAFT.getValue() );

        ContentQueryJsonToContentQueryConverter processor =
            ContentQueryJsonToContentQueryConverter.create().contentQueryJson( contentQueryJson ).contentService( contentService ).build();

        final ContentQuery contentQuery = processor.createQuery();

        assertEquals( 0, contentQuery.getFrom() );
        assertEquals( 100, contentQuery.getSize() );
        assertEquals( ContentTypeNames.from( "myApplication:comment" ), contentQuery.getContentTypes() );
        assertEquals( "(fulltext('displayName^5,_name^3,_alltext', 'check', 'AND') " +
                          "OR ngram('displayName^5,_name^3,_alltext', 'check', 'AND')) ORDER BY _modifiedtime DESC",
                      contentQuery.getQueryExpr().toString() );
    }

    @Test
    public void testFilterQuery()
    {
        final Map<String, Object> dslQueryMap = new HashMap<>();
        dslQueryMap.put( "matchAll", new Object() );

        final List<Map<String, Object>> sortQueryList = new ArrayList<>();
        final Map<String, Object> dslSortQueryMap = new HashMap<>();
        dslSortQueryMap.put( "field", "_score" );
        sortQueryList.add( dslSortQueryMap );

        ContentQueryJson contentQueryJson =
            new ContentQueryJson( null, 0, 100, new ArrayList<>(), null, "summary", null, null, dslQueryMap, sortQueryList,
                                  ContentConstants.BRANCH_DRAFT.getValue() );

        ContentQueryJsonToContentQueryConverter processor =
            ContentQueryJsonToContentQueryConverter.create().contentQueryJson( contentQueryJson ).contentService( contentService ).build();

        final ContentQuery contentQuery = processor.createQuery();

        assertTrue( contentQuery.getQueryExpr().getConstraint() instanceof DslExpr );
        assertTrue( contentQuery.getQueryExpr().getOrderList().size() > 0 &&
                        contentQuery.getQueryExpr().getOrderList().stream().allMatch( orderExpr -> orderExpr instanceof DslOrderExpr ) );
    }

    @Test
    public void testFilterQueryNoSort()
    {
        final Map<String, Object> dslQueryMap = new HashMap<>();
        dslQueryMap.put( "matchAll", new Object() );

        ContentQueryJson contentQueryJson =
            new ContentQueryJson( null, 0, 100, new ArrayList<>(), null, "summary", null, null, dslQueryMap, null,
                                  ContentConstants.BRANCH_DRAFT.getValue() );

        ContentQueryJsonToContentQueryConverter processor =
            ContentQueryJsonToContentQueryConverter.create().contentQueryJson( contentQueryJson ).contentService( contentService ).build();

        final ContentQuery contentQuery = processor.createQuery();

        assertTrue( contentQuery.getQueryExpr().getOrderList().isEmpty() );
    }

    private Content createContent( final String id, final PropertyTree data, final ContentTypeName contentTypeName )
    {
        return Content.create()
            .id( ContentId.from( id ) )
            .data( data )
            .parentPath( ContentPath.ROOT )
            .name( id )
            .valid( true )
            .creator( PrincipalKey.from( "user:system:admin" ) )
            .owner( PrincipalKey.from( "user:myStore:me" ) )
            .language( Locale.ENGLISH )
            .displayName( "My Content" )
            .modifier( PrincipalKey.from( "user:system:admin" ) )
            .type( contentTypeName )
            .build();
    }
}
