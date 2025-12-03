package com.enonic.app.contentstudio.json.content;

import java.util.ArrayList;
import java.util.List;

import com.enonic.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.app.contentstudio.rest.resource.content.ContentPublishInfoResolver;
import com.enonic.xp.content.ContentVersion;
import com.enonic.xp.content.FindContentVersionsResult;

public class GetContentVersionsResultJson
{
    private final List<ContentVersionJson> contentVersions = new ArrayList<>();

    private final long totalHits;

    private final int from;

    public GetContentVersionsResultJson( final FindContentVersionsResult result, int from, final ContentPrincipalsResolver principalsResolver, final
                                         ContentPublishInfoResolver contentPublishInfoResolver )
    {
        this.totalHits = result.getTotalHits();
        this.from = from;
        for ( final ContentVersion contentVersion : result.getContentVersions() )
        {
            this.contentVersions.add( new ContentVersionJson( contentVersion, principalsResolver, contentPublishInfoResolver ) );
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
