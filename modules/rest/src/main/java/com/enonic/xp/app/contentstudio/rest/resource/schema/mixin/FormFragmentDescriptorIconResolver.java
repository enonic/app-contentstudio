package com.enonic.xp.app.contentstudio.rest.resource.schema.mixin;


import com.enonic.xp.icon.Icon;
import com.enonic.xp.schema.content.CmsFormFragmentService;
import com.enonic.xp.schema.formfragment.FormFragmentDescriptor;
import com.enonic.xp.schema.formfragment.FormFragmentName;

public final class FormFragmentDescriptorIconResolver
{
    private final CmsFormFragmentService cmsFormFragmentService;

    public FormFragmentDescriptorIconResolver( final CmsFormFragmentService cmsFormFragmentService )
    {
        this.cmsFormFragmentService = cmsFormFragmentService;
    }

    public Icon resolveIcon( final FormFragmentName name )
    {
        final FormFragmentDescriptor descriptor = cmsFormFragmentService.getByName( name );
        return descriptor == null ? null : descriptor.getIcon();
    }

}
