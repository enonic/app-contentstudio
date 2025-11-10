package com.enonic.app.contentstudio.rest.resource.content.versions;

import com.google.common.base.Preconditions;

import com.enonic.xp.branch.Branches;
import com.enonic.xp.content.ContentId;

public final class GetActiveContentVersionsParams
{
    private final ContentId contentId;

    private final Branches branches;

    private GetActiveContentVersionsParams( Builder builder )
    {
        contentId = builder.contentId;
        branches = builder.branches;
    }

    public static Builder create()
    {
        return new Builder();
    }

    public ContentId getContentId()
    {
        return contentId;
    }

    public Branches getBranches()
    {
        return branches;
    }

    @Override
    public boolean equals( final Object o )
    {
        return super.equals( o );
    }

    @Override
    public int hashCode()
    {
        return super.hashCode();
    }

    public static final class Builder
    {
        private ContentId contentId;

        private Branches branches;

        private Builder()
        {
        }

        public Builder contentId( ContentId contentId )
        {
            this.contentId = contentId;
            return this;
        }

        public Builder branches( Branches branches )
        {
            this.branches = branches;
            return this;
        }

        public GetActiveContentVersionsParams build()
        {
            Preconditions.checkNotNull( this.contentId, "Content id cannot be null" );
            return new GetActiveContentVersionsParams( this );
        }
    }
}
