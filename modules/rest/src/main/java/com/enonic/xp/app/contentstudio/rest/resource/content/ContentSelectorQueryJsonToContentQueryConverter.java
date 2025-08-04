package com.enonic.xp.app.contentstudio.rest.resource.content;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.ApplicationWildcardMatcher;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentSelectorQueryJson;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.content.ContentQuery;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.node.NodeIndexPath;
import com.enonic.xp.query.expr.*;
import com.enonic.xp.query.parser.QueryParser;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeNames;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.site.Site;
import com.google.common.base.Preconditions;

import java.util.List;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import static com.google.common.base.Strings.isNullOrEmpty;

public class ContentSelectorQueryJsonToContentQueryConverter
{
    private final ContentSelectorQueryJson contentQueryJson;

    private final ContentService contentService;

    private final ContentTypeService contentTypeService;

    private final Content content;

    private final ApplicationWildcardMatcher.Mode contentTypeParseMode;

    private Site parentSite;

    private static final FieldExpr PATH_FIELD_EXPR = FieldExpr.from( NodeIndexPath.PATH );

    private ContentSelectorQueryJsonToContentQueryConverter( final Builder builder )
    {
        this.contentQueryJson = builder.contentQueryJson;
        this.contentService = builder.contentService;
        this.content = contentQueryJson.getContentId() != null ? contentService.getById( contentQueryJson.getContentId() ) : null;
        this.contentTypeService = builder.contentTypeService;
        this.contentTypeParseMode = builder.contentTypeParseMode;
    }

    public ContentQuery createQuery()
    {
        final ContentQuery.Builder builder = ContentQuery.create()
            .from( this.contentQueryJson.getFrom() )
            .size( this.contentQueryJson.getSize() )
            .queryExpr( this.createQueryExpr() )
            .addContentTypeNames( this.getContentTypeNamesFromJson() );

        return builder.build();
    }

    private ContentTypeNames getContentTypeNamesFromJson()
    {
        final List<String> contentTypeNames = this.contentQueryJson.getContentTypeNames();

        if ( contentTypeNames.isEmpty() )
        {
            return ContentTypeNames.empty();
        }

        final ApplicationKey applicationKey = getApplicationKey();

        if ( applicationKey != null )
        {
            return this.filterContentTypeNames( applicationKey );
        }

        return ContentTypeNames.from( contentTypeNames );
    }

    private ApplicationKey getApplicationKey()
    {
        if ( this.contentQueryJson.getApplicationKey() != null )
        {
            return this.contentQueryJson.getApplicationKey();
        }

        if ( this.content != null )
        {
            return this.content.getType().getApplicationKey();
        }

        return null;
    }

    private ContentTypeNames filterContentTypeNames( final ApplicationKey applicationKey )
    {
        final ApplicationWildcardMatcher<ContentTypeName> wildcardMatcher =
            new ApplicationWildcardMatcher<>( applicationKey, ContentTypeName::toString, this.contentTypeParseMode );

        final Predicate<ContentTypeName> filter = this.contentQueryJson.getContentTypeNames()
            .stream()
            .map( wildcardMatcher::createPredicate )
            .reduce( Predicate::or )
            .orElse( s -> false );

        return ContentTypeNames.from(
            contentTypeService.getAll().stream().map( ContentType::getName ).filter( filter ).collect( Collectors.toList() ) );
    }

    private QueryExpr createQueryExpr()
    {
        final List<String> allowedPaths = this.contentQueryJson.getAllowedContentPaths();

        if ( allowedPaths.size() == 0 )
        {
            return QueryParser.parse( this.contentQueryJson.getQueryExprString() );
        }

        if ( this.content != null )
        {
            this.resolveParentSite( allowedPaths );
        }

        return this.constructExprWithAllowedPaths( allowedPaths );
    }

    private void resolveParentSite( final List<String> allowedPaths )
    {
        if ( ContentRelativePathResolver.anyPathNeedsSiteResolving( allowedPaths ) )
        {
            this.parentSite = this.contentService.getNearestSite( this.content.getId() );
        }
    }

    private QueryExpr constructExprWithAllowedPaths( final List<String> allowedPaths )
    {

        ConstraintExpr expr = null;

        for ( String allowedPath : allowedPaths )
        {
            expr = this.addAllowPathToExpr( allowedPath, expr );
        }

        if ( isNullOrEmpty( this.contentQueryJson.getQueryExprString() ) )
        {
            return constraintExprToQueryExpr( expr );
        }

        return this.addSearchQueryToExpr( expr );
    }

    private QueryExpr constraintExprToQueryExpr( final ConstraintExpr expr )
    {
        return expr == null ? QueryParser.parse( "" ) : QueryExpr.from( expr );
    }

    private QueryExpr addSearchQueryToExpr( final ConstraintExpr expr )
    {

        final QueryExpr searchQueryExpr = QueryParser.parse( this.contentQueryJson.getQueryExprString() );

        if ( expr == null )
        {
            return searchQueryExpr;
        }

        final ConstraintExpr andExpr = LogicalExpr.and( expr, searchQueryExpr.getConstraint() );
        return QueryExpr.from( andExpr, searchQueryExpr.getOrderList() );
    }

    private ConstraintExpr addAllowPathToExpr( final String allowedPath, final ConstraintExpr expr )
    {
        return createAndAppendExpr( doResolvePath( allowedPath ), expr );
    }

    private String doResolvePath( final String allowedPath )
    {
        if ( ContentRelativePathResolver.hasSiteToResolve( allowedPath ) )
        {
            return ContentRelativePathResolver.resolveWithSite( allowedPath, this.parentSite );
        }
        return ContentRelativePathResolver.resolve( this.content, allowedPath );
    }

    private ConstraintExpr createAndAppendExpr( final String resolvedPath, final ConstraintExpr expr )
    {
        return expr == null ? createCompareExpr( resolvedPath ) : LogicalExpr.or( expr, createCompareExpr( resolvedPath ) );
    }

    private CompareExpr createCompareExpr( final String resolvedPath )
    {
        return CompareExpr.like( PATH_FIELD_EXPR, createValueExpr( resolvedPath ) );
    }

    private ValueExpr createValueExpr( final String resolvedPath )
    {
        return ValueExpr.string( "/" + ContentConstants.CONTENT_ROOT_NAME + resolvedPath );
    }

    public static Builder create()
    {
        return new Builder();
    }

    static class Builder
    {
        private ContentSelectorQueryJson contentQueryJson;

        private ContentService contentService;

        private ContentTypeService contentTypeService;

        private ApplicationWildcardMatcher.Mode contentTypeParseMode;

        public Builder contentQueryJson( final ContentSelectorQueryJson contentQueryJson )
        {
            this.contentQueryJson = contentQueryJson;
            return this;
        }

        public Builder contentService( final ContentService contentService )
        {
            this.contentService = contentService;
            return this;
        }

        public Builder contentTypeService( final ContentTypeService contentTypeService )
        {
            this.contentTypeService = contentTypeService;
            return this;
        }

        public Builder contentTypeParseMode( final ApplicationWildcardMatcher.Mode contentTypeParseMode )
        {
            this.contentTypeParseMode = contentTypeParseMode;
            return this;
        }

        private void validate()
        {
            Preconditions.checkNotNull( contentQueryJson, "contentQueryJson must be set" );
            Preconditions.checkNotNull( contentTypeParseMode, "contentTypeParseMode must be set" );
            Preconditions.checkNotNull( contentService, "contentService must be set" );
        }

        public ContentSelectorQueryJsonToContentQueryConverter build()
        {
            validate();
            return new ContentSelectorQueryJsonToContentQueryConverter( this );
        }
    }
}
