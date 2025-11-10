package com.enonic.app.contentstudio.rest.resource.content;


import com.enonic.xp.region.Component;

public interface ComponentDisplayNameResolver
{
    String resolve( Component component );
}
