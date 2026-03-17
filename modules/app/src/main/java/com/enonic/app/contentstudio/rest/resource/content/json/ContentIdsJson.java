package com.enonic.app.contentstudio.rest.resource.content.json;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentIds;

public class ContentIdsJson
{
    private final ContentIds contentIds;

    public ContentIdsJson( @JsonProperty("contentIds") final List<String> contentIds )
    {
        this.contentIds = contentIds.stream().map( ContentId::from ).collect( ContentIds.collector() );
    }

    public ContentIds getContentIds()
    {
        return contentIds;
    }
}
