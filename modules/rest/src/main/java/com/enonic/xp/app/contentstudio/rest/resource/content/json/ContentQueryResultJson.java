package com.enonic.xp.app.contentstudio.rest.resource.content.json;

import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.Locale;

import com.google.common.collect.ImmutableSet;

import com.enonic.xp.app.contentstudio.json.content.ContentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.JsonObjectsFactory;
import com.enonic.xp.content.Content;

public class ContentQueryResultJson
    extends AbstractContentQueryResultJson<ContentJson>
{
    public ContentQueryResultJson( final Builder builder )
    {
        super( builder );
        this.contents = ImmutableSet.copyOf( builder.contents );
    }

    public static Builder newBuilder( final JsonObjectsFactory jsonObjectsFactory, final Enumeration<Locale> locales )
    {
        return new Builder( jsonObjectsFactory, locales );
    }

    public static class Builder
        extends AbstractContentQueryResultJson.Builder<Builder>
    {
        private final JsonObjectsFactory jsonObjectsFactory;

        private final Enumeration<Locale> locales;

        private final List<ContentJson> contents = new ArrayList<>();

        public Builder( final JsonObjectsFactory jsonObjectsFactory, final Enumeration<Locale> locales )
        {
            this.jsonObjectsFactory = jsonObjectsFactory;
            this.locales = locales;
        }

        @Override
        public Builder addContent( final Content content )
        {
            this.contents.add( jsonObjectsFactory.createContentJson( content, locales ) );
            return this;
        }

        @Override
        public ContentQueryResultJson build()
        {
            return new ContentQueryResultJson( this );
        }
    }
}
