package com.enonic.app.contentstudio.rest.resource.content.json;

import java.util.List;
import java.util.stream.Collectors;

import com.enonic.app.contentstudio.json.content.ContentIdJson;
import com.enonic.xp.content.ContentIds;

public class ResolvePublishContentResultJson
{
    private final List<ContentIdJson> requestedContents;

    private final List<ContentIdJson> dependentContents;

    private final List<ContentIdJson> requiredContents;

    private final List<ContentIdJson> nextDependentContents;

    private final Boolean containsInvalid;

    private final List<ContentIdJson> notPublishableContents;

    private final Boolean somePublishable;

    private final Boolean containsNotReady;

    private final List<ContentIdJson> invalidContents;

    private final List<ContentIdJson> notReadyContents;

    private final List<ContentIdJson> notFoundOutboundContents;

    private ResolvePublishContentResultJson( Builder builder )
    {
        requestedContents = builder.requestedContents.stream().map( ContentIdJson::new ).collect( Collectors.toList() );
        dependentContents = builder.dependentContents.stream().map( ContentIdJson::new ).collect( Collectors.toList() );
        requiredContents = builder.requiredContents.stream().map( ContentIdJson::new ).collect( Collectors.toList() );
        containsInvalid = builder.containsInvalid;
        notPublishableContents = builder.notPublishableContents.stream().map( ContentIdJson::new ).collect( Collectors.toList() );
        somePublishable = builder.somePublishable;
        containsNotReady = builder.containsNotReady;
        invalidContents = builder.invalidContents.stream().map( ContentIdJson::new ).collect( Collectors.toList() );
        notReadyContents = builder.notReadyContents.stream().map( ContentIdJson::new ).collect( Collectors.toList() );
        nextDependentContents = builder.nextDependentContents.stream().map( ContentIdJson::new ).collect( Collectors.toList() );
        notFoundOutboundContents = builder.notFoundOutboundContents.stream().map( ContentIdJson::new ).collect( Collectors.toList() );
    }

    public static Builder create()
    {
        return new Builder();
    }

    @SuppressWarnings("unused")
    public List<ContentIdJson> getRequestedContents()
    {
        return requestedContents;
    }

    @SuppressWarnings("unused")
    public List<ContentIdJson> getDependentContents()
    {
        return dependentContents;
    }

    public List<ContentIdJson> getRequiredContents()
    {
        return requiredContents;
    }

    @SuppressWarnings("unused")
    public Boolean getContainsInvalid()
    {
        return containsInvalid;
    }

    public List<ContentIdJson> getNotPublishableContents()
    {
        return notPublishableContents;
    }

    public Boolean isSomePublishable()
    {
        return somePublishable;
    }

    public Boolean getContainsNotReady()
    {
        return containsNotReady;
    }

    public List<ContentIdJson> getInvalidContents()
    {
        return invalidContents;
    }

    public List<ContentIdJson> getNotReadyContents()
    {
        return notReadyContents;
    }

    public List<ContentIdJson> getNextDependentContents()
    {
        return nextDependentContents;
    }

    public List<ContentIdJson> getNotFoundOutboundContents()
    {
        return notFoundOutboundContents;
    }

    public static final class Builder
    {

        private ContentIds requestedContents;

        private ContentIds dependentContents;

        private ContentIds requiredContents;

        private Boolean containsInvalid;

        private ContentIds notPublishableContents;

        private Boolean somePublishable;

        private Boolean containsNotReady;

        private ContentIds invalidContents;

        private ContentIds notReadyContents;

        private ContentIds nextDependentContents;

        private ContentIds notFoundOutboundContents;

        private Builder()
        {
        }

        public Builder setRequestedContents( final ContentIds requestedContents )
        {
            this.requestedContents = requestedContents;
            return this;
        }

        public Builder setDependentContents( final ContentIds dependentContents )
        {
            this.dependentContents = dependentContents;
            return this;
        }

        public Builder setRequiredContents( final ContentIds requiredContents )
        {
            this.requiredContents = requiredContents;
            return this;
        }

        public Builder setContainsInvalid( final Boolean containsInvalid )
        {
            this.containsInvalid = containsInvalid;
            return this;
        }

        public Builder setNotPublishableContents( final ContentIds notPublishableContents )
        {
            this.notPublishableContents = notPublishableContents;
            return this;
        }

        public Builder setSomePublishable( final Boolean somePublishable )
        {
            this.somePublishable = somePublishable;
            return this;
        }

        public Builder setContainsNotReady( final Boolean containsNotReady )
        {
            this.containsNotReady = containsNotReady;
            return this;
        }

        public Builder setInvalidContents( final ContentIds items )
        {
            this.invalidContents = items;
            return this;
        }

        public Builder setNotReadyContents( final ContentIds items )
        {
            this.notReadyContents = items;
            return this;
        }

        public Builder setNextDependentContents( final ContentIds items )
        {
            this.nextDependentContents = items;
            return this;
        }

        public Builder setNotFoundOutboundContents( final ContentIds items )
        {
            this.notFoundOutboundContents = items;
            return this;
        }

        public ResolvePublishContentResultJson build()
        {
            return new ResolvePublishContentResultJson( this );
        }
    }
}
