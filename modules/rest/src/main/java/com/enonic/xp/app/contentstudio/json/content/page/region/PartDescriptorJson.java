package com.enonic.xp.app.contentstudio.json.content.page.region;

import jakarta.servlet.http.HttpServletRequest;

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
                               final InlineMixinResolver inlineMixinResolver, final HttpServletRequest request )
    {
        super( descriptor, localeMessageResolver, inlineMixinResolver );
        this.icon = new PartDescriptorIconUrlResolver(request).resolve( descriptor );
    }

    public String getIcon()
    {
        return icon;
    }
}
