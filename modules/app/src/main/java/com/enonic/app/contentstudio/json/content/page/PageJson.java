package com.enonic.app.contentstudio.json.content.page;


import java.util.List;

import com.enonic.app.contentstudio.json.content.page.region.ComponentJson;
import com.enonic.app.contentstudio.json.content.page.region.ComponentJsonSerializer;
import com.enonic.app.contentstudio.json.content.page.region.PageRegionsJson;
import com.enonic.app.contentstudio.json.content.page.region.RegionJson;
import com.enonic.app.contentstudio.rest.resource.content.ComponentDisplayNameResolver;
import com.enonic.xp.data.PropertyArrayJson;
import com.enonic.xp.data.PropertyTreeJson;
import com.enonic.xp.page.Page;

@SuppressWarnings("UnusedDeclaration")
public final class PageJson
{
    private final Page page;

    private final PageRegionsJson regionsJson;

    private final List<PropertyArrayJson> configJson;

    private final ComponentJsonSerializer componentJsonSerializer;

    public PageJson( final Page page, final ComponentDisplayNameResolver componentDisplayNameResolver )
    {
        this.page = page;
        this.regionsJson = page.hasRegions() ? new PageRegionsJson( page.getRegions(), componentDisplayNameResolver ) : null;
        this.configJson = page.hasConfig() ? PropertyTreeJson.toJson( page.getConfig() ) : null;
        this.componentJsonSerializer = new ComponentJsonSerializer( componentDisplayNameResolver );
    }

    public String getController()
    {
        return page.hasDescriptor() ? page.getDescriptor().toString() : null;
    }

    public String getTemplate()
    {
        return page.hasTemplate() ? page.getTemplate().toString() : null;
    }

    public List<RegionJson> getRegions()
    {
        return regionsJson != null ? regionsJson.getRegions() : null;
    }

    public List<PropertyArrayJson> getConfig()
    {
        return configJson;
    }

    public boolean isCustomized()
    {
        return page.isCustomized();
    }

    public ComponentJson getFragment()
    {
        return page.isFragment() ? componentJsonSerializer.toJson( page.getFragment() ) : null;
    }
}
