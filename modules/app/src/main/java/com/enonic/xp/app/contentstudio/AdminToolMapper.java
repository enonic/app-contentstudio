package com.enonic.xp.app.contentstudio;

import java.util.Objects;
import java.util.Optional;

import com.enonic.xp.admin.tool.AdminToolDescriptor;
import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapSerializable;

final class AdminToolMapper
    implements MapSerializable
{
    private final AdminToolDescriptor value;

    private final String icon;

    private final StringTranslator stringTranslator;

    AdminToolMapper( final AdminToolDescriptor value, final String icon, final StringTranslator stringTranslator )
    {
        this.value = value;
        this.icon = icon;
        this.stringTranslator = stringTranslator;
    }

    private void serialize( final MapGenerator gen, final AdminToolDescriptor value )
    {
        final String displayNameI18nKey = Objects.requireNonNullElse( value.getDisplayNameI18nKey(), "app.admin.tool." + value.getName() );
        final String displayName = Objects.requireNonNullElse( value.getDisplayName(), value.getKey().toString() );

        gen.value( "application", value.getKey().getApplicationKey().toString() );
        gen.value( "name", value.getKey().getName() );
        gen.value( "key", value.getKey().toString() );
        gen.value( "icon", icon );
        gen.value( "displayName", this.stringTranslator.localize( value.getKey().getApplicationKey(), displayNameI18nKey, displayName ) );
    }


    @Override
    public void serialize( final MapGenerator gen )
    {
        serialize( gen, this.value );
    }
}
