package com.enonic.xp.app.contentstudio.rest.resource.schema.formfragment;

import com.enonic.xp.form.Form;
import com.enonic.xp.schema.content.CmsFormFragmentService;

public final class CmsFormFragmentResolver
{
    private final CmsFormFragmentService cmsFormFragmentService;

    public CmsFormFragmentResolver( final CmsFormFragmentService cmsFormFragmentService )
    {
        this.cmsFormFragmentService = cmsFormFragmentService;
    }

    public Form inlineForm( final Form form )
    {
        return this.cmsFormFragmentService.inlineFormItems( form );
    }
}
