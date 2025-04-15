package com.enonic.xp.app.contentstudio.json.schema.content;

import java.util.List;

import com.google.common.collect.ImmutableList;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.xp.app.contentstudio.rest.resource.schema.content.ContentTypeIconUrlResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypes;

@SuppressWarnings("UnusedDeclaration")
public class ContentTypeSummaryListJson
{
    private final List<ContentTypeSummaryJson> list;

    public ContentTypeSummaryListJson( final ContentTypes contentTypes, final ContentTypeIconUrlResolver iconUrlResolver,
                                       final LocaleMessageResolver localeMessageResolver, final HttpServletRequest request )
    {
        final ImmutableList.Builder<ContentTypeSummaryJson> builder = ImmutableList.builder();
        if ( contentTypes != null )
        {
            for ( final ContentType contentType : contentTypes )
            {
                builder.add( new ContentTypeSummaryJson( contentType, iconUrlResolver, localeMessageResolver, request ) );
            }
        }

        this.list = builder.build();
    }

    public ContentTypeSummaryListJson( final List<ContentTypeSummaryJson> list )
    {
        this.list = List.copyOf( list );
    }

    public int getTotal()
    {
        return this.list.size();
    }

    public List<ContentTypeSummaryJson> getContentTypes()
    {
        return this.list;
    }
}
