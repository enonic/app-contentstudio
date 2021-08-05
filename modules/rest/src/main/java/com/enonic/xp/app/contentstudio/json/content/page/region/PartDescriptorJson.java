package com.enonic.xp.app.contentstudio.json.content.page.region;

import com.enonic.xp.app.contentstudio.json.content.page.DescriptorJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.page.part.PartDescriptorIconUrlResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.mixin.InlineMixinResolver;
import com.enonic.xp.region.PartDescriptor;

public class PartDescriptorJson
    extends DescriptorJson
{
    private final String icon;

    public PartDescriptorJson( final PartDescriptor descriptor, final LocaleMessageResolver localeMessageResolver,
                               final InlineMixinResolver inlineMixinResolver )
    {
        super( descriptor, localeMessageResolver, inlineMixinResolver );
        this.icon = new PartDescriptorIconUrlResolver().resolve( descriptor );
    }

    public String getIcon()
    {
        return icon;
    }
}
