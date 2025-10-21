package com.enonic.xp.app.contentstudio.rest.resource.schema.mixin;

import com.enonic.xp.form.Form;
import com.enonic.xp.schema.content.CmsFormFragmentService;

public final class CmsFormFragmentServiceResolver
{
    private final CmsFormFragmentService cmsFormFragmentService;

    public CmsFormFragmentServiceResolver( final CmsFormFragmentService cmsFormFragmentService )
    {
        this.cmsFormFragmentService = cmsFormFragmentService;
    }

    public Form inlineForm( final Form form )
    {
        return this.cmsFormFragmentService.inlineFormItems( form );
    }
}
