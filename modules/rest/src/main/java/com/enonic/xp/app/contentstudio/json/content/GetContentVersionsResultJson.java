package com.enonic.xp.app.contentstudio.json.content;

import java.util.ArrayList;
import java.util.List;

import com.enonic.xp.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.xp.content.ContentVersion;
import com.enonic.xp.content.FindContentVersionsResult;

public class GetContentVersionsResultJson
{
    private final List<ContentVersionJson> contentVersions = new ArrayList<>();

    private final long totalHits;

    private final int from;

    public GetContentVersionsResultJson( final FindContentVersionsResult result, int from, final ContentPrincipalsResolver principalsResolver )
    {
        this.totalHits = result.getTotalHits();
        this.from = from;
        for ( final ContentVersion contentVersion : result.getContentVersions() )
        {
            this.contentVersions.add( new ContentVersionJson( contentVersion, principalsResolver ) );
        }
    }

    @SuppressWarnings("UnusedDeclaration")
    public List<ContentVersionJson> getContentVersions()
    {
        return contentVersions;
    }

    public long getTotalHits()
    {
        return totalHits;
    }


    public long getHits()
    {
        return contentVersions.size();
    }

    public int getFrom()
    {
        return from;
    }
}
