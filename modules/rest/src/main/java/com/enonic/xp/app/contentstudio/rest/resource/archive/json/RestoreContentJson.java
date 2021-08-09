package com.enonic.xp.app.contentstudio.rest.resource.archive.json;


import java.util.List;

public class RestoreContentJson
{
    private List<String> contentIds;

    private String path;

    public List<String> getContentIds()
    {
        return contentIds;
    }

    public void setContentIds( final List<String> contentIds )
    {
        this.contentIds = contentIds;
    }

    public String getPath()
    {
        return path;
    }

    public void setPath( final String path )
    {
        this.path = path;
    }
}
