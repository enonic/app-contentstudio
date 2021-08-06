package com.enonic.xp.app.contentstudio.rest.resource.auth.json;

import java.time.Instant;

import com.enonic.xp.security.User;

public final class UserJson
{
    private final User user;

    public UserJson( final User user )
    {
        this.user = user;

    }

    public String getKey()
    {
        return user.getKey().toString();
    }

    public String getDisplayName()
    {
        return user.getDisplayName();
    }

    public Instant getModifiedTime()
    {
        return user.getModifiedTime();
    }

    public String getEmail()
    {
        return user.getEmail();
    }

    public String getLogin()
    {
        return user.getLogin();
    }

    public boolean isDisabled()
    {
        return user.isDisabled();
    }
}
