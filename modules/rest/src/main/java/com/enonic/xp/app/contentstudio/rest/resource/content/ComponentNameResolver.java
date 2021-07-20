package com.enonic.xp.app.contentstudio.rest.resource.content;


import com.enonic.xp.region.Component;
import com.enonic.xp.region.ComponentName;

public interface ComponentNameResolver
{
    ComponentName resolve( Component component );
}
