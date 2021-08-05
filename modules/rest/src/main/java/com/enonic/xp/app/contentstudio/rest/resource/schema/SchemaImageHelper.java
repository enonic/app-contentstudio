package com.enonic.xp.app.contentstudio.rest.resource.schema;


import com.enonic.xp.app.contentstudio.rest.resource.BaseImageHelper;

public final class SchemaImageHelper
    extends BaseImageHelper
{
    private final byte[] defaultMixinImage;

    private final byte[] defaultRelationshipTypeImage;

    public SchemaImageHelper()
    {
        defaultMixinImage = loadDefaultImage( "mixin" );
        defaultRelationshipTypeImage = loadDefaultImage( "relationshiptype" );
    }

    public byte[] getDefaultMixinImage()
    {
        return defaultMixinImage;
    }

    public byte[] getDefaultRelationshipTypeImage()
    {
        return defaultRelationshipTypeImage;
    }
}
