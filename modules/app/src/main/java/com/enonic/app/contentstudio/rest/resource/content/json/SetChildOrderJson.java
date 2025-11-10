package com.enonic.app.contentstudio.rest.resource.content.json;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class SetChildOrderJson
{
    private final String contentId;

    private final ChildOrderJson childOrder;

    @JsonCreator
    public SetChildOrderJson( @JsonProperty("contentId") final String contentId,
                              @JsonProperty("childOrder") final ChildOrderJson childOrder )
    {
        this.contentId = contentId;
        this.childOrder = childOrder;
    }

    @SuppressWarnings("UnusedDeclaration")
    public ChildOrderJson getChildOrder()
    {
        return childOrder;
    }

    @SuppressWarnings("UnusedDeclaration")
    public String getContentId()
    {
        return contentId;
    }


}
