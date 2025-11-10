package com.enonic.app.contentstudio.rest.resource.content;


import java.util.Arrays;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import com.enonic.xp.security.acl.Permission;

public enum Access
{
    READ( Permission.READ ),

    WRITE( Permission.READ, Permission.CREATE, Permission.MODIFY, Permission.DELETE ),

    PUBLISH( Permission.READ, Permission.CREATE, Permission.MODIFY, Permission.DELETE, Permission.PUBLISH ),

    FULL( Permission.READ, Permission.CREATE, Permission.MODIFY, Permission.DELETE, Permission.PUBLISH, Permission.WRITE_PERMISSIONS ),

    CUSTOM();

    private final EnumSet<Permission> permissions;

    Access( final Permission... permissions )
    {
        this.permissions = permissions.length == 0 ? EnumSet.noneOf( Permission.class ) : EnumSet.copyOf( Arrays.asList( permissions ) );
    }

    public static Access fromPermissions( final Iterable<Permission> permissions )
    {
        final Set<Permission> filtered = StreamSupport.stream( permissions.spliterator(), true )
            .filter( p -> p != Permission.READ_PERMISSIONS )
            .collect( Collectors.toUnmodifiableSet() );

        return Stream.of( READ, WRITE, PUBLISH, FULL ).
            filter( a -> a.hasPermissions( filtered ) ).
            findFirst().
            orElse( CUSTOM );
    }

    private boolean hasPermissions( final Set<Permission> permissions )
    {
        return permissions.size() == this.permissions.size() && this.permissions.containsAll( permissions );
    }
}
