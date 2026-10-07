package com.enonic.app.contentstudio.rest.resource.content.page.part;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.app.contentstudio.rest.resource.schema.IconUrlResolver;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.region.PartDescriptor;


public final class PartDescriptorIconUrlResolver
    extends IconUrlResolver
{
    public static final String DESCRIPTOR_ICON = ResourceConstants.REST_ROOT + "content/page/part/descriptor/icon/";

    public PartDescriptorIconUrlResolver( final HttpServletRequest request )
    {
        super( request );
    }

    public String resolve( final PartDescriptor partDescriptor )
    {
        final Icon icon = partDescriptor.getIcon();
        if ( icon == null || icon.getSize() == 0 )
        {
            return null;
        }

        final String baseUrl = DESCRIPTOR_ICON + partDescriptor.getKey().toString();
        return generateIconUrl( baseUrl, icon );
    }

}
