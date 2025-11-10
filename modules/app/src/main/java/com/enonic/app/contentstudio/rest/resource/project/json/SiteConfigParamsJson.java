package com.enonic.app.contentstudio.rest.resource.project.json;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.data.PropertyArrayJson;
import com.enonic.xp.data.PropertyTreeJson;
import com.enonic.xp.site.SiteConfig;

public final class SiteConfigParamsJson
{
    private final SiteConfig siteConfig;

    @JsonCreator
    SiteConfigParamsJson( @JsonProperty("applicationKey") final String key,
                          @JsonProperty("config") final List<PropertyArrayJson> config )
    {
        this.siteConfig = SiteConfig.create()
            .application( ApplicationKey.from( key ) )
            .config( PropertyTreeJson.fromJson( config ) )
            .build();
    }

    @JsonIgnore
    public SiteConfig getSiteConfig()
    {
        return siteConfig;
    }
}
