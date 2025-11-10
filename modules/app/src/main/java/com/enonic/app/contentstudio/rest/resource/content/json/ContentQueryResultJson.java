package com.enonic.app.contentstudio.rest.resource.content.json;

import java.util.ArrayList;
import java.util.List;

import com.google.common.collect.ImmutableSet;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.app.contentstudio.json.content.ContentJson;
import com.enonic.app.contentstudio.rest.resource.content.JsonObjectsFactory;
import com.enonic.xp.content.Content;

public class ContentQueryResultJson
    extends AbstractContentQueryResultJson<ContentJson>
{
    public ContentQueryResultJson( final Builder builder )
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

        private final HttpServletRequest request;

        private final List<ContentJson> contents = new ArrayList<>();

        public Builder( final JsonObjectsFactory jsonObjectsFactory, final HttpServletRequest request )
        {
            this.jsonObjectsFactory = jsonObjectsFactory;
            this.request = request;
        }

        @Override
        public Builder addContent( final Content content )
        {
            this.contents.add( jsonObjectsFactory.createContentJson( content, request ) );
            return this;
        }

        @Override
        public ContentQueryResultJson build()
        {
            return new ContentQueryResultJson( this );
        }
    }
}
