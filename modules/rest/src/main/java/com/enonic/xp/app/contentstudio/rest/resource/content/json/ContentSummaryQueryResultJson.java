package com.enonic.xp.app.contentstudio.rest.resource.content.json;

import java.util.ArrayList;
import java.util.List;

import com.google.common.collect.ImmutableSet;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.xp.app.contentstudio.json.content.ContentSummaryJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.JsonObjectsFactory;
import com.enonic.xp.content.Content;

public class ContentSummaryQueryResultJson
    extends AbstractContentQueryResultJson<ContentSummaryJson>
{
    public ContentSummaryQueryResultJson( final Builder builder )
    {
        super( builder );
        this.contents = ImmutableSet.copyOf( builder.contents );
    }

    public static Builder newBuilder( final JsonObjectsFactory jsonObjectsFactory, final HttpServletRequest request )
    {
        return new Builder( jsonObjectsFactory, request );
    }

    public static class Builder
        extends AbstractContentQueryResultJson.Builder<Builder>
    {
        private final JsonObjectsFactory jsonObjectsFactory;

        private final List<ContentSummaryJson> contents = new ArrayList<>();

        private final HttpServletRequest request;

        public Builder( final JsonObjectsFactory jsonObjectsFactory, final HttpServletRequest request )
        {
            this.jsonObjectsFactory = jsonObjectsFactory;
            this.request = request;
        }

        @Override
        public Builder addContent( final Content content )
        {
            this.contents.add( jsonObjectsFactory.createContentSummaryJson( content, request ) );
            return this;
        }

        @Override
        public ContentSummaryQueryResultJson build()
        {
            return new ContentSummaryQueryResultJson( this );
        }

    }
}
