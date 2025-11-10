package com.enonic.app.contentstudio.rest.resource.content.page;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.app.contentstudio.json.content.page.region.PageRegionsJson;
import com.enonic.app.contentstudio.json.content.page.region.RegionJson;
import com.enonic.xp.content.ContentName;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.data.PropertyArrayJson;
import com.enonic.xp.data.PropertyTreeJson;
import com.enonic.xp.descriptor.DescriptorKey;
import com.enonic.xp.schema.content.ContentTypeNames;

public class CreatePageTemplateJson
{
    private final com.enonic.xp.page.CreatePageTemplateParams createTemplate;

    @JsonCreator
    public CreatePageTemplateJson( @JsonProperty("controller") String pageDescriptorKey,
                                   @JsonProperty("config") final List<PropertyArrayJson> config,
                                   @JsonProperty("regions") final List<RegionJson> regions, @JsonProperty("site") final String site,
                                   @JsonProperty("displayName") final String displayName, @JsonProperty("name") final String name,
                                   @JsonProperty("supports") final List<String> supports )
    {
        this.createTemplate = new com.enonic.xp.page.CreatePageTemplateParams().
            controller( pageDescriptorKey != null ? DescriptorKey.from( pageDescriptorKey ) : null ).
            pageConfig( config != null ? PropertyTreeJson.fromJson( config ) : null ).
                regions(regions != null ? new PageRegionsJson(regions).getPageRegions() : null).
            supports( ContentTypeNames.from( supports ) ).
            site( ContentPath.from( site ) ).
                name(ContentName.from("template-" + name)).
            displayName( displayName );
    }

    @JsonIgnore
    public com.enonic.xp.page.CreatePageTemplateParams getCreateTemplate()
    {
        return createTemplate;
    }
}
