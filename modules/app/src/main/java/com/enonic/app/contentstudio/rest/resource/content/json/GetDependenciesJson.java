package com.enonic.app.contentstudio.rest.resource.content.json;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.branch.Branch;
import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.content.ContentIds;

public class GetDependenciesJson
{
    private final ContentIds contentIds;

    private final Branch branch;

    @JsonCreator
    public GetDependenciesJson( @JsonProperty("contentIds") final List<String> contentIds,
                                @JsonProperty("target") final String branch)
    {
        this.contentIds = ContentIds.from( contentIds );
        this.branch = branch != null ? Branch.from( branch ) : ContentConstants.BRANCH_DRAFT;
    }

    @JsonIgnore
    public ContentIds getContentIds()
    {
        return contentIds;
    }

    @JsonIgnore
    public Branch getBranch()
    {
        return branch;
    }
}
