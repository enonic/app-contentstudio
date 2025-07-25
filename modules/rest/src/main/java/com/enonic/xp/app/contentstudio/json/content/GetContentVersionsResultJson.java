package com.enonic.xp.app.contentstudio.json.content;

import java.util.LinkedHashSet;
import java.util.Set;

import com.enonic.xp.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.xp.app.contentstudio.rest.resource.content.versions.ContentVersion;
import com.enonic.xp.app.contentstudio.rest.resource.content.versions.FindContentVersionsResult;

public class GetContentVersionsResultJson
{
    private final Set<ContentVersionJson> contentVersions = new LinkedHashSet<>();

    private final long totalHits;

    private final long hits;

    private final int from;

    private final int size;

    public GetContentVersionsResultJson( final FindContentVersionsResult result, final ContentPrincipalsResolver principalsResolver )
    {
        this.totalHits = result.getTotalHits();
        this.hits = result.getHits();
        this.from = result.getFrom();
        this.size = result.getSize();

        for ( final ContentVersion contentVersion : result.getContentVersions() )
        {
            this.contentVersions.add( new ContentVersionJson( contentVersion, principalsResolver ) );
        }
    }

    @SuppressWarnings("UnusedDeclaration")
    public Set<ContentVersionJson> getContentVersions()
    {
        return contentVersions;
    }

    public long getTotalHits()
    {
        return totalHits;
    }

    public long getHits()
    {
        return hits;
    }

    public int getFrom()
    {
        return from;
    }

    public int getSize()
    {
        return size;
    }
}
