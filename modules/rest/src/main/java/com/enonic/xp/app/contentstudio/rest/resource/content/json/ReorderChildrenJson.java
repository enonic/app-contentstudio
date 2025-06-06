package com.enonic.xp.app.contentstudio.rest.resource.content.json;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class ReorderChildrenJson
{
    private final Boolean manualOrder;

    private final String contentId;

    private final ChildOrderJson childOrder;

    private final List<ReorderChildJson> orderChildren;

    @JsonCreator
    public ReorderChildrenJson( @JsonProperty("manualOrder") final Boolean manualOrder,
                                @JsonProperty("contentId") final String contentId,
                                @JsonProperty("childOrder") final ChildOrderJson childOrder,
                                @JsonProperty("reorderChildren") final List<ReorderChildJson> orderChildren )
    {
        this.manualOrder = manualOrder;
        this.contentId = contentId;
        this.childOrder = childOrder;
        this.orderChildren = orderChildren;
    }

    @SuppressWarnings("UnusedDeclaration")
    public Boolean isManualOrder()
    {
        return manualOrder;
    }

    @SuppressWarnings("UnusedDeclaration")
    public String getContentId()
    {
        return contentId;
    }

    @SuppressWarnings("UnusedDeclaration")
    public ChildOrderJson getChildOrder()
    {
        return childOrder;
    }

    @SuppressWarnings("UnusedDeclaration")
    public List<ReorderChildJson> getReorderChildren()
    {
        return orderChildren;
    }
}
