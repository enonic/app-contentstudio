package com.enonic.xp.app.contentstudio.rest.resource.content;

import javax.ws.rs.container.ResourceInfo;
import javax.ws.rs.core.FeatureContext;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.enonic.xp.app.contentstudio.rest.resource.content.page.PageDescriptorResource;
import com.enonic.xp.app.contentstudio.rest.resource.content.page.PageResource;
import com.enonic.xp.app.contentstudio.rest.resource.content.page.PageTemplateResource;
import com.enonic.xp.app.contentstudio.rest.resource.content.page.fragment.FragmentResource;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.ContentTypeResource;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.FilterByContentResource;
import com.enonic.xp.app.contentstudio.rest.resource.schema.xdata.XDataResource;
import com.enonic.xp.jaxrs.JaxRsComponent;

public class CmsResourceFilterTest
{
    private CmsResourceDynamicFeature feature;

    private ResourceInfo resourceInfo;

    private FeatureContext featureContext;

    @BeforeEach
    public void init()
    {
        this.feature = new CmsResourceDynamicFeature();

        resourceInfo = Mockito.mock( ResourceInfo.class );
        featureContext = Mockito.mock( FeatureContext.class );
    }

    @Test
    public void supported()
    {
        checkResource( ContentResource.class );
        checkResource( ContentImageResource.class );
        checkResource( ContentIconResource.class );
        checkResource( ContentMediaResource.class );
        checkResource( PageResource.class );
        checkResource( PageTemplateResource.class );
        checkResource( FragmentResource.class );
        checkResource( FilterByContentResource.class );
        checkResource( ContentTypeResource.class );
        checkResource( XDataResource.class );
    }

    @Test
    public void not_supported()
    {
        Mockito.doReturn( PageDescriptorResource.class ).when( resourceInfo ).getResourceClass();
        feature.configure( resourceInfo, featureContext );

        Mockito.verify( featureContext, Mockito.times( 0 ) ).register( Mockito.isA( CmsResourceFilter.class ) );
    }

    private void checkResource( final Class<? extends JaxRsComponent> resourceClass )
    {
        Mockito.doReturn( resourceClass ).when( resourceInfo ).getResourceClass();
        feature.configure( resourceInfo, featureContext );
        Mockito.verify( featureContext, Mockito.times( 1 ) ).register( Mockito.isA( CmsResourceFilter.class ) );

        Mockito.reset( featureContext );
    }


}
