package com.enonic.xp.app.contentstudio.rest.resource.content.json;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class ContentVisitorJson
{
    private final String contentId;

    @JsonCreator
    public ContentVisitorJson( final @JsonProperty(value = "contentId", required = true) String contentId )
    {
        this.contentId = contentId;
    }

    public String getContentId()
    {
        return contentId;
    }
}
