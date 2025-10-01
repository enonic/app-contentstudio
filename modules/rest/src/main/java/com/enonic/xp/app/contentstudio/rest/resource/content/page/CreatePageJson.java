package com.enonic.xp.app.contentstudio.rest.resource.content.page;


import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.app.contentstudio.json.content.page.region.ComponentJson;
import com.enonic.xp.app.contentstudio.json.content.page.region.PageRegionsJson;
import com.enonic.xp.app.contentstudio.json.content.page.region.RegionJson;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.data.PropertyArrayJson;
import com.enonic.xp.data.PropertyTreeJson;
import com.enonic.xp.descriptor.DescriptorKey;
import com.enonic.xp.page.Page;
import com.enonic.xp.page.PageTemplateKey;

public class CreatePageJson
{
    private final Page page;

    private final ContentId contentId;

    @JsonCreator
    public CreatePageJson( @JsonProperty("contentId") final String contentId, @JsonProperty("controller") String pageDescriptorKey,
                           @JsonProperty("template") final String pageTemplateKey,
                           @JsonProperty("config") final List<PropertyArrayJson> config,
                           @JsonProperty("regions") final List<RegionJson> regions,
                           @JsonProperty("fragment") final ComponentJson fragment )
    {
        this.contentId = ContentId.from( contentId );
        this.page = Page.create()
            .descriptor( pageDescriptorKey != null ? DescriptorKey.from( pageDescriptorKey ) : null )
            .template( pageTemplateKey != null ? PageTemplateKey.from( pageTemplateKey ) : null )
            .
            config( config != null ? PropertyTreeJson.fromJson( config ) : null ).
            regions( regions != null ? new PageRegionsJson( regions ).getPageRegions() : null ).fragment(
                fragment != null ? fragment.getComponent() : null )
            .build();
    }

    @JsonIgnore
    public Page getPage()
    {
        return this.page;
    }

    @JsonIgnore
    public ContentId getContentId()
    {
        return this.contentId;
    }
}
