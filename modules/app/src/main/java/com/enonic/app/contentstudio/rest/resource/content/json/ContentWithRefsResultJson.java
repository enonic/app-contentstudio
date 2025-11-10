package com.enonic.app.contentstudio.rest.resource.content.json;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;

import com.enonic.app.contentstudio.json.content.ContentIdJson;
import com.enonic.xp.content.ContentId;

public class ContentWithRefsResultJson
{
    private final List<ContentIdJson> contentIds;

    private final List<InboundDependenciesJson> inboundDependencies;

    public ContentWithRefsResultJson( final Builder builder )
    {
        this.contentIds = builder.contentIds.build().stream().map( ContentIdJson::new ).collect( Collectors.toList() );
        this.inboundDependencies = builder.inboundDependencies.build();
    }

    public static Builder create()
    {
        return new Builder();
    }

    public List<ContentIdJson> getContentIds()
    {
        return contentIds;
    }

    public List<InboundDependenciesJson> getInboundDependencies()
    {
        return inboundDependencies;
    }

    public static class InboundDependenciesJson {
        private final List<ContentIdJson> inboundDependencies;

        private final ContentIdJson id;

        public InboundDependenciesJson( final Builder builder )
        {
            this.id = new ContentIdJson(builder.id);
            this.inboundDependencies = builder.inboundDependencies.build().stream().map( ContentIdJson::new ).collect( Collectors.toList() );
        }

        public List<ContentIdJson> getInboundDependencies()
        {
            return inboundDependencies;
        }

        public ContentIdJson getId()
        {
            return id;
        }

        public static Builder create()
        {
            return new Builder();
        }

        public static final class Builder
        {
            private ContentId id;

            private final ImmutableList.Builder<ContentId> inboundDependencies = ImmutableList.builder();

            private Builder()
            {
            }

            public Builder id( final ContentId id )
            {
                this.id = id;
                return this;
            }

            public Builder addInboundDependencies( final Collection<ContentId> ids )
            {
                this.inboundDependencies.addAll( ids );
                return this;
            }

            private void validate() {
                Preconditions.checkNotNull( id, "id must be set" );
            }

            public InboundDependenciesJson build()
            {
                validate();
                return new InboundDependenciesJson( this );
            }
        }

    }

    public static final class Builder
    {
        private final ImmutableList.Builder<ContentId> contentIds = ImmutableList.builder();

        private final ImmutableList.Builder<InboundDependenciesJson> inboundDependencies = ImmutableList.builder();

        private Builder()
        {
        }

        public Builder addContentIds( final Collection<ContentId> ids )
        {
            this.contentIds.addAll( ids );
            return this;
        }

        public Builder addInboundDependencies( final Collection<InboundDependenciesJson> ids )
        {
            this.inboundDependencies.addAll( ids );
            return this;
        }

        public ContentWithRefsResultJson build()
        {
            return new ContentWithRefsResultJson( this );
        }
    }

}
