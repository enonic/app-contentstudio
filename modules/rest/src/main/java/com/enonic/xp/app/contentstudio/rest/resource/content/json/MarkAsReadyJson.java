package com.enonic.xp.app.contentstudio.rest.resource.content.json;


import java.util.List;

public class MarkAsReadyJson
{
    private List<String> contentIds;

    public List<String> getContentIds()
    {
        return contentIds;
    }

    @SuppressWarnings("unused")
    public void setContentIds( final List<String> contentIds )
    {
        this.contentIds = contentIds;
    }
}
