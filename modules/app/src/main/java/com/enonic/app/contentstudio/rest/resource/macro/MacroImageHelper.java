package com.enonic.app.contentstudio.rest.resource.macro;

import com.enonic.app.contentstudio.rest.resource.BaseImageHelper;

public final class MacroImageHelper
    extends BaseImageHelper
{
    private final byte[] defaultMacroImage;

    public MacroImageHelper()
    {
        defaultMacroImage = loadDefaultImage( "macro" );
    }

    public byte[] getDefaultMacroImage()
    {
        return defaultMacroImage;
    }
}
