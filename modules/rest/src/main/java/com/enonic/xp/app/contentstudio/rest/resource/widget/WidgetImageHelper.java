package com.enonic.xp.app.contentstudio.rest.resource.widget;

import com.enonic.xp.app.contentstudio.rest.resource.BaseImageHelper;
import com.enonic.xp.icon.Icon;

public final class WidgetImageHelper
    extends BaseImageHelper
{
    private final Icon defaultWidgetIcon;

    public WidgetImageHelper()
    {
        defaultWidgetIcon = loadDefaultIcon( "widget" );
    }

    public Icon getDefaultWidgetIcon()
    {
        return defaultWidgetIcon;
    }
}
