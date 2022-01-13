package com.enonic.xp.app.contentstudio.json;

public class CollaboratorJson
{
    private final String sessionId;

    private final String key;

    public CollaboratorJson( final String sessionId, final String key )
    {
        this.sessionId = sessionId;
        this.key = key;
    }

    public String getSessionId()
    {
        return sessionId;
    }

    public String getKey()
    {
        return key;
    }
}
