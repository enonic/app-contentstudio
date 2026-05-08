package com.enonic.app.contentstudio.rest.resource.content;

import java.util.Optional;

import org.apache.commons.text.StringSubstitutor;

import com.enonic.xp.content.Content;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.content.GetContentTypeParams;
import com.enonic.xp.util.GenericValue;

import static com.google.common.base.Strings.nullToEmpty;
import static java.util.Objects.requireNonNullElse;

public class ContentListTitleResolver
{
    private static final String PREFIX = "${";

    private static final String SUFFIX = "}";

    private static final char ESCAPE = '$';

    private final ContentTypeService contentTypeService;

    public ContentListTitleResolver( final ContentTypeService contentTypeService )
    {
        this.contentTypeService = contentTypeService;
    }

    public String resolve( final Content content )
    {
        final ContentType contentType = contentTypeService.getByName( GetContentTypeParams.from( content.getType() ) );

        final String listTitleExpression =
            Optional.ofNullable( contentType ).flatMap( ct -> ct.getSchemaConfig().optional( "listTitleExpression" ) ).map(
                GenericValue::asString ).orElse( "" );

        if ( nullToEmpty( listTitleExpression ).isBlank() )
        {
            return content.getDisplayName();
        }
        else
        {
            final PropertyTree propertyTree = new PropertyTree();
            if ( content.getData() != null )
            {
                propertyTree.addSet( "data", content.getData().getRoot().copy( propertyTree ) );
            }
            propertyTree.addString( "displayName", content.getDisplayName() );

            return new StringSubstitutor( k -> requireNonNullElse( propertyTree.getString( k ), "" ), PREFIX, SUFFIX, ESCAPE ).replace(
                listTitleExpression );
        }
    }
}
