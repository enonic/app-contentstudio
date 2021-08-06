package com.enonic.xp.app.contentstudio.rest.resource.content.json;


import com.enonic.xp.app.contentstudio.json.content.ContentJson;

public class ContentTreeSelectorJson
{
    private final ContentJson content;

    private final Boolean selectable;

    private final Boolean expandable;

    public ContentTreeSelectorJson( final ContentJson content, final Boolean selectable, final Boolean expandable )
    {
        this.content = content;
        this.selectable = selectable;
        this.expandable = expandable;
    }

    public ContentJson getContent()
    {
        return content;
    }

    public Boolean getSelectable()
    {
        return selectable;
    }

    public Boolean getExpandable()
    {
        return expandable;
    }
}
