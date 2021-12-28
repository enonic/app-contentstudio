package com.enonic.xp.app.contentstudio;

import java.util.Set;

import com.enonic.xp.app.contentstudio.json.VisitorJson;
import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapSerializable;

public class VisitorsMapper
    implements MapSerializable
{
    private final Set<VisitorJson> visitors;

    public VisitorsMapper( final Set<VisitorJson> visitors )
    {
        this.visitors = visitors;
    }

    @Override
    public void serialize( final MapGenerator gen )
    {
        gen.array( "visitors" );
        visitors.forEach( visitorJson -> {
            gen.map();
            gen.value( "sessionId", visitorJson.getSessionId() );
            gen.value( "userKey", visitorJson.getKey() );
            gen.end();
        } );
        gen.end();
    }
}
