package com.enonic.app.contentstudio.rest;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;

import com.enonic.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.app.contentstudio.rest.resource.content.CmsResourceDynamicFeature;
import com.enonic.xp.jaxrs.JaxRsService;
import com.enonic.xp.jaxrs.JaxRsServiceFactory;
import com.enonic.xp.web.dispatch.DispatchConstants;

@Component(immediate = true)
public final class AdminCmsRestActivator
{
    private JaxRsService service;

    @Activate
    public void activate()
    {
        this.service.init();
    }

    @Deactivate
    public void deactivate()
    {
        this.service.destroy();
    }

    @Reference
    public void setService( final JaxRsServiceFactory factory )
    {
        this.service = factory.newService( "v2cs", ResourceConstants.REST_ROOT, DispatchConstants.XP_CONNECTOR );
        this.service.add( new CmsResourceDynamicFeature() );
    }
}
