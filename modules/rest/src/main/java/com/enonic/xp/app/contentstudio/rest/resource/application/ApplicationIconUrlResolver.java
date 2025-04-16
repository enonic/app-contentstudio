package com.enonic.xp.app.contentstudio.rest.resource.application;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.xp.app.ApplicationDescriptor;
import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.app.contentstudio.rest.resource.schema.IconUrlResolver;
import com.enonic.xp.icon.Icon;

public final class ApplicationIconUrlResolver
    extends IconUrlResolver
{
    private static final String REST_SCHEMA_ICON_URL = ResourceConstants.REST_ROOT + "application/icon/";

    public ApplicationIconUrlResolver( final HttpServletRequest request )
    {
        super( request );
    }

    public String resolve( final ApplicationKey applicationKey, final ApplicationDescriptor applicationDescriptor )
    {
        final String baseUrl = REST_SCHEMA_ICON_URL + applicationKey.toString();
        final Icon icon = applicationDescriptor == null ? null : applicationDescriptor.getIcon();
        return generateIconUrl( baseUrl, icon );
    }
}
