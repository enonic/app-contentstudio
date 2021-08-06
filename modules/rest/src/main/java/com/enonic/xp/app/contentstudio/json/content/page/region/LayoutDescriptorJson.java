package com.enonic.xp.app.contentstudio.json.content.page.region;

import java.util.ArrayList;
import java.util.List;

import com.enonic.xp.app.contentstudio.json.content.page.DescriptorJson;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.mixin.InlineMixinResolver;
import com.enonic.xp.region.LayoutDescriptor;
import com.enonic.xp.region.RegionDescriptor;
import com.enonic.xp.region.RegionDescriptors;

public class LayoutDescriptorJson
    extends DescriptorJson
{
    private final List<RegionDescriptorJson> regionsJson;

    public LayoutDescriptorJson( final LayoutDescriptor descriptor, final LocaleMessageResolver localeMessageResolver,
                                 final InlineMixinResolver inlineMixinResolver )
    {
        super( descriptor, localeMessageResolver, inlineMixinResolver );

        final RegionDescriptors regions = descriptor.getRegions();
        this.regionsJson = new ArrayList<>( regions.numberOfRegions() );
        for ( final RegionDescriptor regionDescriptor : regions )
        {
            this.regionsJson.add( new RegionDescriptorJson( regionDescriptor ) );
        }
    }

    public List<RegionDescriptorJson> getRegions()
    {
        return this.regionsJson;
    }
}
