package com.enonic.app.contentstudio.json.content;

public enum ContentDiffField
{
    PATH( "path" ),
    DISPLAY_NAME( "displayName" ),
    DATA( "data" ),
    MIXINS( "mixins" ),
    LANGUAGE( "language" ),
    OWNER( "owner" ),
    INHERIT( "inherit" );

    private final String jsonName;

    ContentDiffField( final String jsonName )
    {
        this.jsonName = jsonName;
    }

    public String getJsonName()
    {
        return jsonName;
    }
}
