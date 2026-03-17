package com.enonic.app.contentstudio.rest.resource.content.json;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentPaths;

public class ContentPathsJson
{
    private final ContentPaths contentPaths;

    public ContentPathsJson( @JsonProperty("contentPaths") final List<String> contentPaths )
    {
        this.contentPaths = contentPaths.stream().map( ContentPath::from ).collect( ContentPaths.collector() );
    }

    public ContentPaths getContentPaths()
    {
        return contentPaths;
    }
}
