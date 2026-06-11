package com.enonic.app.contentstudio.rest.resource.content;

import org.apache.commons.text.StringSubstitutor;

import com.enonic.xp.content.Content;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.content.GetContentTypeParams;

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

        final String displayNameListExpression = contentType == null ? null : contentType.getDisplayNameListExpression();

        if ( nullToEmpty( displayNameListExpression ).isBlank() )
        {
            return content.getDisplayName();
        }

        final PropertyTree propertyTree = new PropertyTree();
        if ( content.getData() != null )
        {
            propertyTree.addSet( "data", content.getData().getRoot().copy( propertyTree ) );
        }
        propertyTree.addString( "displayName", content.getDisplayName() );

        return new StringSubstitutor( k -> requireNonNullElse( propertyTree.getString( k ), "" ), PREFIX, SUFFIX, ESCAPE ).replace(
            displayNameListExpression );
    }
}
