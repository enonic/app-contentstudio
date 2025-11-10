package com.enonic.app.contentstudio.rest.resource.macro.json;

import com.enonic.xp.macro.Macro;

public final class PreviewMacroStringResultJson
{
    private final String macroStr;

    public PreviewMacroStringResultJson( final Macro macro )
    {
        macroStr = macro.toString();
    }

    public String getMacro()
    {
        return macroStr;
    }
}
