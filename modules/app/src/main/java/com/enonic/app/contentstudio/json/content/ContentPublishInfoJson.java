package com.enonic.app.contentstudio.json.content;

import java.time.Instant;

import com.enonic.xp.content.ContentPublishInfo;

public class ContentPublishInfoJson
{
    private final Instant from;

    private final Instant to;

    private final Instant first;

    private final Instant published;

    public ContentPublishInfoJson( final ContentPublishInfo publishInfo )
    {
        this.from = publishInfo.from();
        this.to = publishInfo.to();
        this.first = publishInfo.first();
        this.published = publishInfo.published();
    }

    @SuppressWarnings("unused")
    public Instant getFrom()
    {
        return from;
    }

    @SuppressWarnings("unused")
    public Instant getTo()
    {
        return to;
    }

    @SuppressWarnings("unused")
    public Instant getFirst()
    {
        return first;
    }

    @SuppressWarnings("unused")
    public Instant getPublished()
    {
        return published;
    }
}
