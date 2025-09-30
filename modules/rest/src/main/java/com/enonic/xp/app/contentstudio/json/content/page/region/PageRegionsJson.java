package com.enonic.xp.app.contentstudio.json.content.page.region;

import com.enonic.xp.app.contentstudio.rest.resource.content.ComponentDisplayNameResolver;
import com.enonic.xp.region.Region;
import com.enonic.xp.region.Regions;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;
import java.util.List;

@SuppressWarnings("UnusedDeclaration")
public class PageRegionsJson
{
    private final Regions regions;

    private final List<RegionJson> regionsJson;

    public PageRegionsJson(final Regions regions, final ComponentDisplayNameResolver componentDisplayNameResolver)
    {
        this.regions = regions;

        if ( regions != null )
        {
            regionsJson = new ArrayList<>();
            for ( Region region : regions )
            {
                regionsJson.add( new RegionJson( region, componentDisplayNameResolver ) );
            }
        }
        else
        {
            regionsJson = null;
        }
    }

    @JsonCreator
    public PageRegionsJson( final List<RegionJson> regionJsons )
    {
        this.regionsJson = regionJsons;
        final Regions.Builder builder = Regions.create();
        for ( RegionJson region : regionJsons )
        {
            builder.add( region.getRegion() );
        }
        this.regions = builder.build();
    }

    public List<RegionJson> getRegions()
    {
        return regionsJson;
    }

    @JsonIgnore
    public Regions getPageRegions()
    {
        return regions;
    }
}
