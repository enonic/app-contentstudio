package com.enonic.xp.app.contentstudio.rest.resource.widget;

import com.enonic.xp.admin.widget.WidgetDescriptor;
import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.app.contentstudio.rest.resource.schema.IconUrlResolver;
import com.enonic.xp.icon.Icon;

public class WidgetIconUrlResolver
    extends IconUrlResolver
{
    private static final String REST_SCHEMA_ICON_URL = ResourceConstants.REST_ROOT + "widget/icon/";

    public String resolve( final WidgetDescriptor widgetDescriptor )
    {
        if ( widgetDescriptor != null && widgetDescriptor.getIcon() != null )
        {
            final String appKeyStr = widgetDescriptor.getApplicationKey().toString();
            final String name = widgetDescriptor.getName();
            final String baseUrl = REST_SCHEMA_ICON_URL + appKeyStr + "/" + name;
            final Icon icon = widgetDescriptor.getIcon();
            return generateIconUrl( baseUrl, icon );
        }

        return null;
    }
}
