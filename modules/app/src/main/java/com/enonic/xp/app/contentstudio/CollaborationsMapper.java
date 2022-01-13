package com.enonic.xp.app.contentstudio;

import java.util.Set;

import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapSerializable;

public class CollaborationsMapper
    implements MapSerializable
{
    private final Set<String> collaborators;

    public CollaborationsMapper( final Set<String> collaborators )
    {
        this.collaborators = collaborators;
    }

    @Override
    public void serialize( final MapGenerator gen )
    {
        gen.array( "collaborators" );
        collaborators.forEach( collaboratorId -> {
            String[] collaboratorDetails = collaboratorId.split( "=", -1 );
            gen.map();
            gen.value( "sessionId", collaboratorDetails[0] );
            gen.value( "userKey", collaboratorDetails[1] );
            gen.end();
        } );
        gen.end();
    }
}
