package com.enonic.app.contentstudio.rest.resource.issue.json;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.issue.IssueType;

public final class CountStatsJson
{
    private final IssueType issueType;

    @JsonCreator
    public CountStatsJson( @JsonProperty("type") final String type )
    {
        this.issueType = type == null ? null : IssueType.valueOf( type );
    }

    public IssueType getIssueType()
    {
        return issueType;
    }
}
