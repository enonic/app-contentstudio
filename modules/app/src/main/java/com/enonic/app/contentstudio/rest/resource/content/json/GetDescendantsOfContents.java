package com.enonic.app.contentstudio.rest.resource.content.json;

import java.util.Set;

import com.enonic.xp.content.CompareStatus;

public class GetDescendantsOfContents
{
    private Set<String> contentPaths;

    public Set<String> getContentPaths()
    {
        return contentPaths;
    }

    public void setContentPaths( final Set<String> contentPaths )
    {
        this.contentPaths = contentPaths;
    }
}
