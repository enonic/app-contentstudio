package com.enonic.xp.app.contentstudio;

import java.util.Set;

import com.enonic.xp.app.contentstudio.json.CollaboratorJson;
import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapSerializable;

public class CollaborationMapper
    implements MapSerializable
{
    private final Set<CollaboratorJson> collaborators;

    public CollaborationMapper( final Set<CollaboratorJson> collaborators )
    {
        this.collaborators = collaborators;
    }

    @Override
    public void serialize( final MapGenerator gen )
    {
        gen.array( "collaborators" );
        collaborators.forEach( collaborator -> {
            gen.map();
            gen.value( "sessionId", collaborator.getSessionId() );
            gen.value( "userKey", collaborator.getKey() );
            gen.end();
        } );
        gen.end();
    }
}
