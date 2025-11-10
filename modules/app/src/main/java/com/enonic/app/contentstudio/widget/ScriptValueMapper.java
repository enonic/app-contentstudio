package com.enonic.app.contentstudio.widget;

import com.enonic.xp.script.ScriptValue;
import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapSerializable;

public final class ScriptValueMapper
    implements MapSerializable
{
    private final ScriptValue value;

    public ScriptValueMapper( final ScriptValue value )
    {
        this.value = value;
    }

    @Override
    public void serialize( final MapGenerator gen )
    {
        if ( this.value == null )
        {
            return;
        }

        if ( this.value.isObject() )
        {
            this.value.getMap().forEach( gen::value );
        }
        else if ( this.value.isArray() )
        {
            this.value.getArray().forEach( gen::value );
        }
        else if ( this.value.isValue() )
        {
            gen.value( this.value.getValue() );
        }
    }
}
