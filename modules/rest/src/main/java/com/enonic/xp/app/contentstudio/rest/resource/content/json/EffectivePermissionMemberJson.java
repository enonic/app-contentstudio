package com.enonic.xp.app.contentstudio.rest.resource.content.json;

public final class EffectivePermissionMemberJson
{
    public String key;

    public String displayName;

    public EffectivePermissionMemberJson( final String key, final String displayName )
    {
        this.key = key;
        this.displayName = displayName;
    }
}
