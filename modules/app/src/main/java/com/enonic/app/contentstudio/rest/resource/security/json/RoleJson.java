package com.enonic.app.contentstudio.rest.resource.security.json;


import java.util.List;

import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.PrincipalKeys;
import com.enonic.xp.security.Role;

import static java.util.stream.Collectors.toList;

public final class RoleJson
    extends PrincipalJson
{
    private final List<String> members;

    public RoleJson( final Role role, final PrincipalKeys members )
    {
        super( role );
        this.members = members.stream().map( PrincipalKey::toString ).collect( toList() );
    }

    public List<String> getMembers()
    {
        return members;
    }
}
