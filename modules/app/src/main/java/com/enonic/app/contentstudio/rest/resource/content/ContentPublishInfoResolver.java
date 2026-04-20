package com.enonic.app.contentstudio.rest.resource.content;

import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentNotFoundException;
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

    public boolean versionExists( final ContentId contentId, final ContentVersionId contentVersionId )
    {
        try
        {
            return contentService.getByIdAndVersionId( contentId, contentVersionId ) != null;
        }
        catch ( ContentNotFoundException e )
        {
            return false;
        }
    }
}
