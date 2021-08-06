package com.enonic.xp.app.contentstudio.json.issue;


import com.enonic.xp.app.contentstudio.rest.resource.issue.IssueListMetaData;

public class IssueListMetaDataJson
{
    private final long totalHits;

    private final long hits;

    public IssueListMetaDataJson( final IssueListMetaData metaData )
    {
        this.totalHits = metaData.getTotalHits();
        this.hits = metaData.getHits();
    }

    public long getTotalHits()
    {
        return totalHits;
    }

    public long getHits()
    {
        return hits;
    }
}
