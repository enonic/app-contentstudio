package com.enonic.app.contentstudio.json.content;

import java.time.Instant;

import com.enonic.xp.content.ContentPublishInfo;

public class ContentPublishInfoJson
{
    private final Instant from;

    private final Instant to;

    private final Instant first;

    private final Instant time;

    public ContentPublishInfoJson( final ContentPublishInfo publishInfo )
    {
        this.from = publishInfo.from();
        this.to = publishInfo.to();
        this.first = publishInfo.first();
        this.time = publishInfo.time();
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
    public Instant getTime()
    {
        return time;
    }
}
