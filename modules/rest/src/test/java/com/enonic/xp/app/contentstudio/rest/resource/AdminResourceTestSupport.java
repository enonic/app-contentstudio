package com.enonic.xp.app.contentstudio.rest.resource;

import com.enonic.xp.jaxrs.impl.JaxRsResourceTestSupport;

public abstract class AdminResourceTestSupport
    extends JaxRsResourceTestSupport
{
    public AdminResourceTestSupport()
    {
        setBasePath( ResourceConstants.REST_ROOT );
    }
}
