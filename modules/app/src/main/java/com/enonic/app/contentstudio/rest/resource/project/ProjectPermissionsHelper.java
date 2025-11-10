package com.enonic.app.contentstudio.rest.resource.project;

import java.util.Set;
import java.util.stream.Collectors;

import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.PrincipalKeys;

public class ProjectPermissionsHelper
{
    public static Set<String> principalKeysAsStrings( final PrincipalKeys principalKeys )
    {
        return principalKeys.stream().map( PrincipalKey::toString ).collect( Collectors.toSet() );
    }
}
