package com.enonic.app.contentstudio.rest.resource.macro;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.app.contentstudio.rest.resource.schema.IconUrlResolver;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.macro.MacroDescriptor;
import com.enonic.xp.macro.MacroKey;

public class MacroIconUrlResolver
    extends IconUrlResolver
{
    public static final String REST_SCHEMA_ICON_URL = ResourceConstants.REST_ROOT + "macro/icon/";

    private final MacroIconResolver macroIconResolver;

    public MacroIconUrlResolver( final MacroIconResolver macroIconResolver, final HttpServletRequest request )
    {
        super( request );
        this.macroIconResolver = macroIconResolver;
    }

    public String resolve( final MacroDescriptor macroDescriptor )
    {
        final String baseUrl = REST_SCHEMA_ICON_URL + macroDescriptor.getKey().toString();
        final Icon icon = macroDescriptor.getIcon();
        return generateIconUrl( baseUrl, icon );
    }

    public String resolve( final MacroKey macroKey )
    {
        final String baseUrl = REST_SCHEMA_ICON_URL + macroKey.toString();
        final Icon icon = macroIconResolver.resolveIcon( macroKey );
        return generateIconUrl( baseUrl, icon  );
    }
}
