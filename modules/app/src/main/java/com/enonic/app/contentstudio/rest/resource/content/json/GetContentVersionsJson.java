package com.enonic.app.contentstudio.rest.resource.content.json;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class GetContentVersionsJson
{
    private final String cursor;

    private final Integer size;

    private final String contentId;

    @JsonCreator
    public GetContentVersionsJson( @JsonProperty("size") final Integer size,
                                    @JsonProperty("cursor") final String cursor,
                                   @JsonProperty("contentId") final String contentId )
    {
        this.cursor = cursor;
        this.size = size;
        this.contentId = contentId;
    }

    @SuppressWarnings("UnusedDeclaration")
    public String  getCursor()
    {
        return cursor;
    }

    @SuppressWarnings("UnusedDeclaration")
    public Integer getSize()
    {
        return size;
    }

    @SuppressWarnings("UnusedDeclaration")
    public String getContentId()
    {
        return contentId;
    }
}
