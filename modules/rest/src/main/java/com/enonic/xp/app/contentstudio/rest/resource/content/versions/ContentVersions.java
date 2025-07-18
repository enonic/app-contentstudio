package com.enonic.xp.app.contentstudio.rest.resource.content.versions;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import com.google.common.collect.ImmutableList;

import com.enonic.xp.content.ContentId;

public final class ContentVersions
    implements Iterable<ContentVersion>
{
    private final ImmutableList<ContentVersion> contentVersions;

    private final ContentId contentId;

    private ContentVersions( Builder builder )
    {
        contentVersions = ImmutableList.copyOf( builder.contentVersions );
        contentId = builder.contentId;
    }

    public ContentId getContentId()
    {
        return contentId;
    }

    public static Builder create()
    {
        return new Builder();
    }

    @Override
    public Iterator<ContentVersion> iterator()
    {
        return this.contentVersions.iterator();
    }


    public static final class Builder
    {
        private final List<ContentVersion> contentVersions = new ArrayList<>();

        private ContentId contentId;

        private Builder()
        {
        }

        public Builder add( final ContentVersion contentVersion )
        {
            this.contentVersions.add( contentVersion );
            return this;
        }

        public Builder contentId( ContentId contentId )
        {
            this.contentId = contentId;
            return this;
        }

        public ContentVersions build()
        {
            return new ContentVersions( this );
        }
    }
}
