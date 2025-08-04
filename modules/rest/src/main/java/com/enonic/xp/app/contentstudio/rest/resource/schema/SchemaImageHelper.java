package com.enonic.xp.app.contentstudio.rest.resource.schema;


import com.enonic.xp.app.contentstudio.rest.resource.BaseImageHelper;

public final class SchemaImageHelper
    extends BaseImageHelper
{
    private final byte[] defaultMixinImage;

    public SchemaImageHelper()
    {
        defaultMixinImage = loadDefaultImage( "mixin" );
    }

    public byte[] getDefaultMixinImage()
    {
        return defaultMixinImage;
    }
}
