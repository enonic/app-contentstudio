package com.enonic.xp.app.contentstudio.rest.resource.content.json;

import java.util.ArrayList;
import java.util.List;

import com.google.common.collect.ImmutableSet;

import com.enonic.xp.app.contentstudio.json.content.ContentSummaryJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.JsonObjectsFactory;
import com.enonic.xp.content.Content;

public class ContentSummaryQueryResultJson
    extends AbstractContentQueryResultJson<ContentSummaryJson>
{
//    private final Map<String, Integer> statuses;

    public ContentSummaryQueryResultJson( final Builder builder )
    {
        super( builder );
        this.contents = ImmutableSet.copyOf( builder.contents );
//        this.statuses = ImmutableMap.copyOf( builder.statuses );
    }

    public static Builder newBuilder( final JsonObjectsFactory jsonObjectsFactory )
    {
        return new Builder( jsonObjectsFactory );
    }

//    public Map<String, Integer> getStatuses()
//    {
//        return statuses;
//    }

    public static class Builder
        extends AbstractContentQueryResultJson.Builder<Builder>
    {
        private final JsonObjectsFactory jsonObjectsFactory;

        private final List<ContentSummaryJson> contents = new ArrayList<>();

//        private Map<String, Integer> statuses;

        public Builder( final JsonObjectsFactory jsonObjectsFactory )
        {
            this.jsonObjectsFactory = jsonObjectsFactory;
        }

        @Override
        public Builder addContent( final Content content )
        {
            this.contents.add( jsonObjectsFactory.createContentSummaryJson( content ) );
            return this;
        }

//        public Builder statuses( final Map<String, Integer> statuses )
//        {
//            this.statuses = statuses;
//            return this;
//        }

        @Override
        public ContentSummaryQueryResultJson build()
        {
            return new ContentSummaryQueryResultJson( this );
        }

    }
}
