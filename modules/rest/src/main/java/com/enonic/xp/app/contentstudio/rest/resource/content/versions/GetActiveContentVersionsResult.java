package com.enonic.xp.app.contentstudio.rest.resource.content.versions;

import java.util.ArrayList;
import java.util.List;

import com.google.common.collect.ImmutableList;

public final class GetActiveContentVersionsResult
{
    private final ImmutableList<ActiveContentVersionEntry> activeContentVersions;

    private GetActiveContentVersionsResult( final Builder builder )
    {
        this.activeContentVersions = ImmutableList.copyOf( builder.activeContentVersions);
    }

    public List<ActiveContentVersionEntry> getActiveContentVersions()
    {
        return activeContentVersions;
    }

    public static GetActiveContentVersionsResult.Builder create()
    {
        return new GetActiveContentVersionsResult.Builder();
    }

    public static final class Builder
    {
        private final List<ActiveContentVersionEntry> activeContentVersions = new ArrayList<>();

        private Builder()
        {
        }

        public GetActiveContentVersionsResult.Builder add( final ActiveContentVersionEntry activeContentVersion )
        {
            if ( activeContentVersion != null && activeContentVersion.getContentVersion() != null )
            {
                this.activeContentVersions.add( activeContentVersion );
            }

            return this;
        }

        public GetActiveContentVersionsResult build()
        {
            return new GetActiveContentVersionsResult( this );
        }
    }
}
