package com.enonic.app.contentstudio.json.content.page;

import java.util.ArrayList;
import java.util.List;

import com.google.common.base.Preconditions;

import com.enonic.app.contentstudio.json.content.page.region.RegionDescriptorJson;
import com.enonic.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.app.contentstudio.rest.resource.schema.mixin.CmsFormFragmentResolver;
import com.enonic.xp.page.PageDescriptor;
import com.enonic.xp.region.RegionDescriptor;
import com.enonic.xp.region.RegionDescriptors;

public class PageDescriptorJson
    extends DescriptorJson
{
    private final List<RegionDescriptorJson> regionsJson;

    public PageDescriptorJson( final PageDescriptor descriptor, final LocaleMessageResolver localeMessageResolver,
                               final CmsFormFragmentResolver inlineMixinResolver )
    {
        super( descriptor, localeMessageResolver, inlineMixinResolver );
        Preconditions.checkNotNull( descriptor );
        Preconditions.checkNotNull( localeMessageResolver );

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
