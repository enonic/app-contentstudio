package com.enonic.xp.app.contentstudio.json.content;

import java.util.Objects;

import com.enonic.xp.content.ContentId;

public class ContentVisitorParams
{
    private final ContentId contentId;

    public ContentVisitorParams( final ContentId contentId )
    {
        this.contentId = Objects.requireNonNull( contentId );
    }

    public ContentId getContentId()
    {
        return contentId;
    }

}
