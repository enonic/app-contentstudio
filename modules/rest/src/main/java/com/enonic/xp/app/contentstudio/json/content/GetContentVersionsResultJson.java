package com.enonic.xp.app.contentstudio.json.content;

import java.util.LinkedHashSet;
import java.util.Set;

import com.enonic.xp.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.xp.content.ContentVersion;
import com.enonic.xp.content.FindContentVersionsResult;

public class GetContentVersionsResultJson
{
    private final Set<ContentVersionJson> contentVersions = new LinkedHashSet<>();

    private final long totalHits;

    public GetContentVersionsResultJson( final FindContentVersionsResult result, final ContentPrincipalsResolver principalsResolver )
    {
        this.totalHits = result.getTotalHits();

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
}
