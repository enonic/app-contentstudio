package com.enonic.xp.app.contentstudio;

import com.enonic.xp.admin.tool.AdminToolDescriptor;
import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapSerializable;

final class AdminToolMapper
    implements MapSerializable
{
    private final AdminToolDescriptor value;

    private final String icon;

    AdminToolMapper( final AdminToolDescriptor value, final String icon )
    {
        this.value = value;
        this.icon = icon;
    }

    private void serialize( final MapGenerator gen, final AdminToolDescriptor value )
    {
        gen.value( "application", value.getKey().getApplicationKey().toString() );
        gen.value( "name", value.getKey().getName() );
        gen.value( "key", value.getKey().toString() );
        gen.value( "icon", icon );
    }


    @Override
    public void serialize( final MapGenerator gen )
    {
        serialize( gen, this.value );
    }
}
