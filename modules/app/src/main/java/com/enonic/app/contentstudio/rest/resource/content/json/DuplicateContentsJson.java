package com.enonic.app.contentstudio.rest.resource.content.json;


import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class DuplicateContentsJson
{
    private final List<DuplicateContentJson> contents;

    @JsonCreator
    public DuplicateContentsJson( @JsonProperty("contents") final List<DuplicateContentJson> contents )
    {
        this.contents = contents;
    }

    public List<DuplicateContentJson> getContents()
    {
        return contents;
    }
}
