package com.enonic.app.contentstudio.rest.resource.project.json;

import java.util.List;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.data.PropertyArrayJson;

public class SiteConfigJson
{
    private final String key;

    private final List<PropertyArrayJson> config;

    SiteConfigJson( final ApplicationKey key, final  List<PropertyArrayJson> config )
    {
        this.key = key.toString();
        this.config = config;
    }

    public String getKey()
    {
        return key;
    }

    public  List<PropertyArrayJson> getConfig()
    {
        return config;
    }
}
