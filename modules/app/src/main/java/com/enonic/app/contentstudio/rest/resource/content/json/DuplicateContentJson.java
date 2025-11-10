package com.enonic.app.contentstudio.rest.resource.content.json;

import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class DuplicateContentJson
{
    private final String contentId;

    private final Boolean includeChildren;

    private final Boolean variant;

    private final String name;

    private final String parent;

    @JsonCreator
    public DuplicateContentJson( @JsonProperty("contentId") final String contentId,
                                 @JsonProperty("includeChildren") final Boolean includeChildren,
                                 @JsonProperty("variant") final Boolean variant, @JsonProperty("name") final String name,
                                 @JsonProperty("parent") final String parent )
    {
        this.contentId = contentId;
        this.includeChildren = includeChildren;
        this.variant = Objects.requireNonNullElse( variant, false );
        this.name = name;
        this.parent = parent;
    }

    public String getContentId()
    {
        return contentId;
    }

    public Boolean getIncludeChildren()
    {
        return includeChildren;
    }

    public Boolean getVariant()
    {
        return variant;
    }

    public String getName()
    {
        return name;
    }

    public String getParent()
    {
        return parent;
    }
}
