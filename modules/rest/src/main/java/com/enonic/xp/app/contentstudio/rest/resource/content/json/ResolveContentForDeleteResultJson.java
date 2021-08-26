package com.enonic.xp.app.contentstudio.rest.resource.content.json;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import com.google.common.collect.ImmutableList;

import com.enonic.xp.app.contentstudio.json.content.ContentIdJson;
import com.enonic.xp.content.ContentId;

public class ResolveContentForDeleteResultJson
{
    private final List<ContentIdJson> contentIds;

    private final List<ContentIdJson> inboundDependencies;

    public ResolveContentForDeleteResultJson( final Builder builder )
    {
        this.contentIds = builder.contentIds.build().stream().map( ContentIdJson::new ).collect( Collectors.toList() );
        this.inboundDependencies = builder.inboundDependencies.build().stream().map( ContentIdJson::new ).collect( Collectors.toList() );
    }

    public static Builder create()
    {
        return new Builder();
    }

    public List<ContentIdJson> getContentIds()
    {
        return contentIds;
    }

    public List<ContentIdJson> getInboundDependencies()
    {
        return inboundDependencies;
    }

    public static final class Builder
    {
        private final ImmutableList.Builder<ContentId> contentIds = ImmutableList.builder();

        private final ImmutableList.Builder<ContentId> inboundDependencies = ImmutableList.builder();

        private Builder()
        {
        }

        public Builder addContentIds( final Collection<ContentId> ids )
        {
            this.contentIds.addAll( ids );
            return this;
        }

        public Builder addInboundDependencies( final Collection<ContentId> ids )
        {
            this.inboundDependencies.addAll( ids );
            return this;
        }

        public ResolveContentForDeleteResultJson build()
        {
            return new ResolveContentForDeleteResultJson( this );
        }
    }

}
