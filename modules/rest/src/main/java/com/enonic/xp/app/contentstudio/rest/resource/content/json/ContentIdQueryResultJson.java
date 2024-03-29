package com.enonic.xp.app.contentstudio.rest.resource.content.json;

import java.util.LinkedHashSet;
import java.util.Set;

import com.google.common.collect.ImmutableSet;

import com.enonic.xp.app.contentstudio.json.content.ContentIdJson;
import com.enonic.xp.content.Content;

public class ContentIdQueryResultJson
    extends AbstractContentQueryResultJson<ContentIdJson>
{
    public ContentIdQueryResultJson( final Builder builder )
    {
        super( builder );
        this.contents = ImmutableSet.copyOf( builder.contents );
    }

    public static Builder newBuilder()
    {
        return new Builder();
    }

    public static class Builder
        extends AbstractContentQueryResultJson.Builder<Builder>
    {
        private final Set<ContentIdJson> contents = new LinkedHashSet<>();

        @Override
        public Builder addContent( final Content content )
        {
            this.contents.add( new ContentIdJson( content.getId() ) );
            return this;
        }

        @Override
        public ContentIdQueryResultJson build()
        {
            return new ContentIdQueryResultJson( this );
        }
    }
}
