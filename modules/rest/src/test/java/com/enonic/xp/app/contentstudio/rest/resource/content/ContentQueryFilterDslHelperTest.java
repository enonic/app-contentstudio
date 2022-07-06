package com.enonic.xp.app.contentstudio.rest.resource.content;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentQueryJson;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.core.impl.PropertyTreeMarshallerServiceFactory;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.form.PropertyTreeMarshallerService;
import com.enonic.xp.json.ObjectMapperHelper;
import com.enonic.xp.query.expr.DslExpr;
import com.enonic.xp.query.expr.DslOrderExpr;
import com.enonic.xp.query.expr.QueryExpr;
import com.enonic.xp.schema.mixin.MixinService;
import com.enonic.xp.util.JsonHelper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class ContentQueryFilterDslHelperTest
{
    private ContentService contentService;

    private static final ObjectMapper MAPPER = ObjectMapperHelper.create();

    private static final PropertyTreeMarshallerService MARSHALLER_SERVICE =
        PropertyTreeMarshallerServiceFactory.newInstance( Mockito.mock( MixinService.class ) );

    @BeforeEach
    public void setUp()
    {
        contentService = Mockito.mock( ContentService.class );
    }

    @Test
    public void testOrderExpressions()
    {
        final ContentQueryJson contentQueryJson =
            new ContentQueryJson( "", 0, 100, new ArrayList<>(), null, "summary", null, null, "features", null, new ArrayList<>() );

        final ContentQueryFilterDslHelper helper = new ContentQueryFilterDslHelper( contentQueryJson );
        final QueryExpr queryExpr = helper.createFilterDslQuery();

        assertTrue( queryExpr.getOrderList().size() == 2 );
        assertTrue( queryExpr.getOrderList().get( 0 ) instanceof DslOrderExpr );
        assertTrue( queryExpr.getOrderList().get( 1 ) instanceof DslOrderExpr );

        final DslOrderExpr dslOrderExpr1 = (DslOrderExpr) queryExpr.getOrderList().get( 0 );
        final DslOrderExpr dslOrderExpr2 = (DslOrderExpr) queryExpr.getOrderList().get( 1 );
        assertEquals( "_score", dslOrderExpr1.toString() );
        assertEquals( "_path ASC", dslOrderExpr2.toString() );
    }

    @Test
    public void testQueryForSearchText()
        throws Exception
    {
        final ContentQueryJson contentQueryJson =
            new ContentQueryJson( "", 0, 100, new ArrayList<>(), null, "summary", null, null, "features", null, new ArrayList<>() );

        test( contentQueryJson, "filter_query_search_text.json" );
    }

    @Test
    public void testQueryNoSearchText()
        throws Exception
    {
        final ContentQueryJson contentQueryJson =
            new ContentQueryJson( "", 0, 100, new ArrayList<>(), null, "summary", null, null, "", null, new ArrayList<>() );

        test( contentQueryJson, "filter_query_no_search_text.json" );
    }

    @Test
    public void testQueryWithConstraints()
        throws Exception
    {
        final ArrayList<String> constraints = new ArrayList<>();
        constraints.add( "id1" );
        constraints.add( "id2" );
        final ContentQueryJson contentQueryJson =
            new ContentQueryJson( "", 0, 100, new ArrayList<>(), null, "summary", null, null, "features", null, constraints );

        test( contentQueryJson, "filter_query_with_constraints.json" );
    }

    @Test
    public void testQueryWithConstraintsNoSearchText()
        throws Exception
    {
        final ArrayList<String> constraints = new ArrayList<>();
        constraints.add( "id1" );
        constraints.add( "id2" );
        final ContentQueryJson contentQueryJson =
            new ContentQueryJson( "", 0, 100, new ArrayList<>(), null, "summary", null, null, "", null, constraints );

        test( contentQueryJson, "filter_query_with_constraints_no_search_text.json" );
    }

    @Test
    public void testQueryWithInboundRefs()
        throws Exception
    {
        final ContentQueryJson contentQueryJson =
            new ContentQueryJson( "", 0, 100, new ArrayList<>(), null, "summary", null, null, "features", "inboundContentId",
                                  new ArrayList<>() );

        test( contentQueryJson, "filter_query_with_inbound_refs.json" );
    }

    @Test
    public void testQueryWithInboundRefsNoSearchText()
        throws Exception
    {
        final ContentQueryJson contentQueryJson =
            new ContentQueryJson( "", 0, 100, new ArrayList<>(), null, "summary", null, null, "", "inboundContentId", new ArrayList<>() );

        test( contentQueryJson, "filter_query_with_inbound_refs_no_search_text.json" );
    }

    private void test( final ContentQueryJson contentQueryJson, final String fileName )
    {
        final ContentQueryFilterDslHelper helper = new ContentQueryFilterDslHelper( contentQueryJson );
        final QueryExpr queryExpr = helper.createFilterDslQuery();

        assertTrue( queryExpr.getConstraint() instanceof DslExpr );

        final DslExpr dslExpr = (DslExpr) queryExpr.getConstraint();
        final PropertyTree tree = loadPropertyTreeFromFile( fileName );

        assertEquals( tree, dslExpr.getExpression() );
    }

    private PropertyTree loadPropertyTreeFromFile( final String fileName )
    {
        final String queryString = loadResourceByName( fileName );

        return readJson( queryString );
    }

    protected PropertyTree readJson( final String value )
    {
        final JsonNode jsonNode = JsonHelper.from( value );

        return MARSHALLER_SERVICE.marshal( MAPPER.convertValue( jsonNode, new TypeReference<Map<String, Object>>()
        {

        } ) );
    }

    protected final String loadResourceByName( final String name )
    {
        try (InputStream stream = getClass().getResourceAsStream( name ))
        {
            return new String( stream.readAllBytes(), StandardCharsets.UTF_8 );
        }
        catch ( Exception e )
        {
            throw new RuntimeException( "Cannot load test-resource with name [" + name + "] in [" + getClass().getPackage() + "]" );
        }
    }

}
