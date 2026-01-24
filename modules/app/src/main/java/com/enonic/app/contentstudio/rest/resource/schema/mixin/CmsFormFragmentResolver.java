package com.enonic.app.contentstudio.rest.resource.schema.mixin;

import com.enonic.xp.form.Form;
import com.enonic.xp.schema.content.CmsFormFragmentService;

public final class CmsFormFragmentResolver
{
    private final CmsFormFragmentService service;

    public CmsFormFragmentResolver( final CmsFormFragmentService service )
    {
        this.service = service;
    }

    public Form inlineForm( final Form form )
    {
        return this.service.inlineFormItems( form );
    }
}
