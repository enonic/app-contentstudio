package com.enonic.app.contentstudio.rest.resource.content;


import java.util.List;
import java.util.Locale;

import com.enonic.xp.region.Component;

public interface ComponentDisplayNameResolver
{
    String resolve( Component component, List<Locale> locales );

    default String resolve( Component component )
    {
        return resolve( component, List.of() );
    }
}
