package com.enonic.xp.app.contentstudio.rest.resource.widget.json;

import java.util.Map;
import java.util.Set;

import com.google.common.collect.ImmutableSet;

import com.enonic.xp.app.contentstudio.rest.resource.widget.WidgetIconUrlResolver;
import com.enonic.xp.admin.widget.WidgetDescriptor;

public final class WidgetDescriptorJson
{

    public String key;

    public String displayName;

    public String description;

    public String iconUrl;

    public String url;

    public Set<String> interfaces;

    public Map<String, String> config;

    public WidgetDescriptorJson( final WidgetDescriptor widgetDescriptor )
    {
        this.key = widgetDescriptor.getKeyString();
        this.displayName = widgetDescriptor.getDisplayName();
        this.description = widgetDescriptor.getDescription();
        this.iconUrl = new WidgetIconUrlResolver().resolve( widgetDescriptor );
        this.url = widgetDescriptor.getUrl();
        this.interfaces = ImmutableSet.copyOf( widgetDescriptor.getInterfaces() );
        this.config = widgetDescriptor.getConfig();
    }
}
