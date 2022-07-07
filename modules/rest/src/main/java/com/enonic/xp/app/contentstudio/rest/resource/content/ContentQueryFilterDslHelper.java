package com.enonic.xp.app.contentstudio.rest.resource.content;

import java.util.ArrayList;
import java.util.List;

import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentQueryJson;
import com.enonic.xp.content.ContentIds;
import com.enonic.xp.data.PropertySet;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.query.expr.DslExpr;
import com.enonic.xp.query.expr.DslOrderExpr;
import com.enonic.xp.query.expr.QueryExpr;

public class ContentQueryFilterDslHelper
{
    private final ContentQueryJson contentQueryJson;

    public ContentQueryFilterDslHelper( final ContentQueryJson contentQueryJson )
    {
        this.contentQueryJson = contentQueryJson;
    }

    public QueryExpr createFilterDslQuery()
    {
        return QueryExpr.from( createSearchExpr(), createSortByScoreExpr(), createSortByPathExpr() );
    }

    private DslExpr createSearchExpr()
    {
        if ( isConstraintItemsPresent() )
        {
            return dslFromBoolean( containsTextOrMatchesIdOnConstraints() );
        }

        if ( this.contentQueryJson.getInboundReferenceId() != null )
        {
            return dslFromBoolean( containsTextOrMatchesIdOnInboundIds() );
        }

        return dslFromBoolean( containsTextOrMatchesId() );
    }

    private DslExpr dslFromBoolean( final PropertySet data )
    {
        final PropertyTree expr = new PropertyTree();
        expr.addSet( "boolean", data );

        return DslExpr.from( expr );
    }

    private PropertySet containsTextOrMatchesIdOnConstraints()
    {
        final List<NamedPropertySet> props = new ArrayList<>();

        props.add( new NamedPropertySet( "boolean", containsTextOrMatchesId() ) );
        props.add( new NamedPropertySet( "boolean", makeConstraintsExpr() ) );

        return dslMust( props );
    }

    private PropertySet containsTextOrMatchesId()
    {
        final String searchText = this.contentQueryJson.getSearchText() != null ? this.contentQueryJson.getSearchText() : "";
        final List<NamedPropertySet> props = new ArrayList<>();

        props.add( new NamedPropertySet( "boolean", mustContainText( searchText ) ) );
        props.add( new NamedPropertySet( "term", idMustMatch( searchText ) ) );

        return dslShould( props );
    }

    private PropertySet mustContainText( final String searchText )
    {
        return searchText.isEmpty() ? makeMatchAllExpr() : makeFulltextOrNgramExpr( searchText );
    }

    private PropertySet dslShould( final List<NamedPropertySet> shouldExpressions )
    {
        return dslBooleanOperator( "should", shouldExpressions );
    }

    private PropertySet dslBooleanOperator( final String operator, final List<NamedPropertySet> subExpressions )
    {
        final PropertySet resultingPropertySet = new PropertySet();
        final PropertySet booleanExpr = resultingPropertySet.addSet( operator );

        subExpressions.forEach( entry -> {
            booleanExpr.addSet( entry.name, entry.props );
        } );

        return resultingPropertySet;
    }

    private PropertySet makeFulltextOrNgramExpr( final String searchText )
    {
        final List<NamedPropertySet> props = new ArrayList<>();

        props.add( new NamedPropertySet( "fulltext", this.makeSearchTextDslTree( searchText ) ) );
        props.add( new NamedPropertySet( "ngram", this.makeSearchTextDslTree( searchText ) ) );

        return dslShould( props );
    }

    private PropertySet makeMatchAllExpr()
    {
        final List<NamedPropertySet> props = new ArrayList<>();
        props.add( new NamedPropertySet( "matchAll", new PropertySet() ) );

        return dslShould( props );
    }

    private PropertySet makeSearchTextDslTree( final String searchText )
    {
        final PropertySet props = new PropertySet();

        props.addStrings( "fields", "displayName^5", "_name^3", "_allText" );
        props.addString( "query", searchText );
        props.addString( "operator", "AND" );

        return props;
    }

    private PropertySet idMustMatch( final String searchText )
    {
        return fieldMustMatch( "_id", searchText );
    }

    private PropertySet fieldMustMatch( final String field, final String value )
    {
        final PropertySet props = new PropertySet();

        props.addString( "field", field );
        props.addString( "value", value );

        return props;
    }

    private boolean isConstraintItemsPresent()
    {
        final ContentIds constraintItems = this.contentQueryJson.getConstraintItemsIds();
        return constraintItems != null && constraintItems.isNotEmpty();
    }

    private PropertySet dslMust( final List<NamedPropertySet> mustExpressions )
    {
        return dslBooleanOperator( "must", mustExpressions );
    }

    private PropertySet makeConstraintsExpr()
    {
        final List<NamedPropertySet> props = new ArrayList<>();

        this.contentQueryJson.getConstraintItemsIds()
            .stream()
            .forEach( contentId -> props.add( new NamedPropertySet( "term", idMustMatch( contentId.toString() ) ) ) );

        return dslShould( props );
    }

    private DslOrderExpr createSortByScoreExpr()
    {
        final PropertyTree expr = new PropertyTree();
        expr.addString( "field", "_score" );

        return DslOrderExpr.from( expr );
    }

    private DslOrderExpr createSortByPathExpr()
    {
        final PropertyTree expr = new PropertyTree();
        expr.addString( "field", "_path" );
        expr.addString( "direction", "ASC" );

        return DslOrderExpr.from( expr );
    }

    private PropertySet containsTextOrMatchesIdOnInboundIds()
    {
        final List<NamedPropertySet> props = new ArrayList<>();

        props.add( new NamedPropertySet( "boolean", containsTextOrMatchesId() ) );
        props.add( new NamedPropertySet( "boolean", makeInboundReferencesProps() ) );

        return dslMust( props );
    }

    private PropertySet makeInboundReferencesProps()
    {
        final List<NamedPropertySet> props = new ArrayList<>();
        final String contentIdAsString = this.contentQueryJson.getInboundReferenceId().toString();

        props.add( new NamedPropertySet( "term", fieldMustMatch( "_references", contentIdAsString ) ) );
        props.add( new NamedPropertySet( "boolean", makeIdMustNotMatchProps( contentIdAsString ) ) );

        return dslMust( props );
    }

    private PropertySet makeIdMustNotMatchProps( final String value )
    {
        final List<NamedPropertySet> props = new ArrayList<>();

        props.add( new NamedPropertySet( "term", idMustMatch( value ) ) );

        return dslMustNot( props );
    }

    private PropertySet dslMustNot( final List<NamedPropertySet> mustExpressions )
    {
        return dslBooleanOperator( "mustNot", mustExpressions );
    }

    private class NamedPropertySet
    {
        private final String name;

        private final PropertySet props;

        private NamedPropertySet( final String name, final PropertySet props )
        {
            this.name = name;
            this.props = props;
        }
    }
}
