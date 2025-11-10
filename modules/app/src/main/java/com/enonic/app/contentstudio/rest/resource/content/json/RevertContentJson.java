package com.enonic.app.contentstudio.rest.resource.content.json;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.content.ContentId;

public class RevertContentJson
{

    private final ContentId contentId;

    private final String versionId;

    @JsonCreator
    public RevertContentJson( final @JsonProperty(value = "contentId", required = true) String contentId,
                              final @JsonProperty(value = "versionId", required = true) String versionId )
    {
        this.contentId = ContentId.from( contentId );
        this.versionId = versionId;
    }

    public ContentId getContentId()
    {
        return contentId;
    }

    public String getVersionId()
    {
        return versionId;
    }

}
