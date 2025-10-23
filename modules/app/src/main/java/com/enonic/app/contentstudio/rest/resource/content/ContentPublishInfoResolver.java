package com.enonic.xp.app.contentstudio.rest.resource.content;

import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentPublishInfo;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.ContentVersionId;

public class ContentPublishInfoResolver
{
    ContentService contentService;

    public ContentPublishInfoResolver( ContentService contentService )
    {
        this.contentService = contentService;
    }

    public ContentPublishInfo resolvePublishInfo( final ContentId contentId, ContentVersionId contentVersionId )
    {
        return contentService.getByIdAndVersionId( contentId, contentVersionId ).getPublishInfo();
    }
}
