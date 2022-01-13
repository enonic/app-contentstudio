package com.enonic.xp.app.contentstudio.json;

public class CollaborationParams
{
    private String contentId;

    private String sessionId;

    private String userKey;

    public void setContentId( final String contentId )
    {
        this.contentId = contentId;
    }

    public void setSessionId( final String sessionId )
    {
        this.sessionId = sessionId;
    }

    public void setUserKey( final String userKey )
    {
        this.userKey = userKey;
    }

    public String getContentId()
    {
        return contentId;
    }

    public String getSessionId()
    {
        return sessionId;
    }

    public String getUserKey()
    {
        return userKey;
    }
}
