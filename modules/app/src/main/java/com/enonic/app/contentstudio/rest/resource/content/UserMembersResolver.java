package com.enonic.app.contentstudio.rest.resource.content;

import java.util.HashMap;
import java.util.Map;

import com.google.common.collect.ImmutableSet;

import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.PrincipalKeys;
import com.enonic.xp.security.PrincipalRelationship;
import com.enonic.xp.security.PrincipalRelationships;
import com.enonic.xp.security.SecurityService;

import static java.util.Objects.requireNonNull;
import static java.util.stream.Collectors.toList;

final class UserMembersResolver
{
    private final SecurityService securityService;

    private final Map<PrincipalKey, PrincipalKeys> membersCache;

    UserMembersResolver( final SecurityService securityService )
    {
        this.securityService = requireNonNull( securityService );
        this.membersCache = new HashMap<>();
    }

    public PrincipalKeys getUserMembers( final PrincipalKey principal )
    {
        final PrincipalKeys cachedValue = this.membersCache.get( principal );
        if ( cachedValue != null )
        {
            return cachedValue;
        }

        final ImmutableSet.Builder<PrincipalKey> members = ImmutableSet.builder();
        doGetUserMembers( members, principal );

        final PrincipalKeys membersResult = PrincipalKeys.from( members.build() );
        this.membersCache.put( principal, membersResult );
        return membersResult;
    }

    private void doGetUserMembers( final ImmutableSet.Builder<PrincipalKey> members, final PrincipalKey principal )
    {
        final PrincipalKeys newMembers = this.getMembers( principal );
        members.add( newMembers.stream().filter( PrincipalKey::isUser ).toArray( PrincipalKey[]::new ) );

        for ( PrincipalKey member : newMembers )
        {
            if ( !member.isUser() && !membersCache.containsKey( member ) )
            {
                doGetUserMembers( members, member );
            }
        }
    }

    private PrincipalKeys getMembers( final PrincipalKey principal )
    {
        final PrincipalKeys cachedValue = this.membersCache.get( principal );
        if ( cachedValue != null )
        {
            return cachedValue;
        }

        final PrincipalRelationships relationships = this.securityService.getRelationships( principal );
        final PrincipalKeys members = PrincipalKeys.from( relationships.stream().map( PrincipalRelationship::getTo ).collect( toList() ) );

        this.membersCache.put( principal, members );
        return members;
    }

}
