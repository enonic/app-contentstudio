package com.enonic.xp.app.contentstudio.rest.resource.content.json;

import java.util.Set;

public class UnpublishContentJson
{
    private Set<String> ids;

    private boolean includeChildren;

    public Set<String> getIds()
    {
        return ids;
    }

    public boolean isIncludeChildren()
    {
        return includeChildren;
    }

    @SuppressWarnings("unused")
    public void setIncludeChildren( final boolean includeChildren )
    {
        this.includeChildren = includeChildren;
    }

    @SuppressWarnings("unused")
    public void setIds( final Set<String> ids )
    {
        this.ids = ids;
    }
}
