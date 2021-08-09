package com.enonic.xp.app.contentstudio.rest.resource.archive.json;

import java.util.List;

public class ArchiveContentJson
{
    private List<String> contentIds;

    public List<String> getContentIds()
    {
        return contentIds;
    }

    public void setContentIds( final List<String> contentIds )
    {
        this.contentIds = contentIds;
    }
}
