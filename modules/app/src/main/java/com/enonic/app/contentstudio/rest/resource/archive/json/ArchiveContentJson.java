package com.enonic.app.contentstudio.rest.resource.archive.json;

import java.util.List;

public class ArchiveContentJson
{
    private List<String> contentIds;

    private String message;

    public List<String> getContentIds()
    {
        return contentIds;
    }

    public void setContentIds( final List<String> contentIds )
    {
        this.contentIds = contentIds;
    }

    public String getMessage()
    {
        return message;
    }

    public void setMessage( final String message )
    {
        this.message = message;
    }
}
