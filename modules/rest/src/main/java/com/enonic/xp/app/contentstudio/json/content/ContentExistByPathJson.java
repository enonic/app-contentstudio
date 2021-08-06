package com.enonic.xp.app.contentstudio.json.content;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ContentExistByPathJson
{

    private final String contentPath;

    private final boolean exists;

    public ContentExistByPathJson( final String contentPath, final boolean exists )
    {
        this.contentPath = contentPath;
        this.exists = exists;
    }

    public String getContentPath()
    {
        return contentPath;
    }

    @JsonProperty("exists")
    @SuppressWarnings("UnusedDeclaration")
    public boolean exists()
    {
        return exists;
    }
}
