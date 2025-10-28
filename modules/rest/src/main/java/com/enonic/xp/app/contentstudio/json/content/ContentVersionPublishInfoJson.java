package com.enonic.xp.app.contentstudio.json.content;

import java.time.Instant;

import com.enonic.xp.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.xp.content.ContentPublishInfo;
import com.enonic.xp.content.ContentVersionCommitInfo;
import com.enonic.xp.security.Principal;

public class ContentVersionPublishInfoJson
{
    private final String publisher;

    private final Instant timestamp;

    private final String message;

    private final String publisherDisplayName;

    private final String type;

    private final ContentPublishInfoJson contentPublishInfo;

    public ContentVersionPublishInfoJson( final ContentPublishInfo publishInfo, final ContentVersionCommitInfo commitInfo,
                                          final ContentPrincipalsResolver principalsResolver )
    {
        this.timestamp = commitInfo.getTimestamp();
        this.message = commitInfo.getMessage();

        final Principal publisher = principalsResolver.findPrincipal( commitInfo.getCommiter() );

        this.publisher = commitInfo.getCommiter().toString();
        this.publisherDisplayName = publisher != null ? publisher.getDisplayName() : "";
        this.type =  commitInfo.getType() != null ? commitInfo.getType().toString() : null;

        this.contentPublishInfo = new ContentPublishInfoJson( publishInfo );
    }

    public String getPublisher()
    {
        return publisher;
    }

    public Instant getTimestamp()
    {
        return timestamp;
    }

    public String getMessage()
    {
        return message;
    }

    public String getPublisherDisplayName()
    {
        return publisherDisplayName;
    }

    public String getType()
    {
        return type;
    }

    public ContentPublishInfoJson getContentPublishInfo()
    {
        return contentPublishInfo;
    }
}
