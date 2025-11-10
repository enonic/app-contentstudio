package com.enonic.app.contentstudio.rest.resource.content;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.core.FeatureContext;

import com.enonic.app.contentstudio.rest.resource.content.page.PageDescriptorResource;
import com.enonic.app.contentstudio.rest.resource.content.page.PageResource;
import com.enonic.app.contentstudio.rest.resource.content.page.PageTemplateResource;
import com.enonic.app.contentstudio.rest.resource.content.page.fragment.FragmentResource;
import com.enonic.app.contentstudio.rest.resource.schema.content.ContentTypeResource;
import com.enonic.app.contentstudio.rest.resource.schema.content.FilterByContentResource;
import com.enonic.xp.jaxrs.JaxRsComponent;

import static org.mockito.Mockito.*;

public class CmsResourceFilterTest
{
    private CmsResourceDynamicFeature feature;

    private ResourceInfo resourceInfo;

    private FeatureContext featureContext;

    @BeforeEach
    public void init()
    {
        this.feature = new CmsResourceDynamicFeature();

        resourceInfo = mock( ResourceInfo.class );
        featureContext = mock( FeatureContext.class );
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
    }

    @Test
    public void not_supported()
    {
        doReturn( PageDescriptorResource.class ).when( resourceInfo ).getResourceClass();
        feature.configure( resourceInfo, featureContext );

        verify( featureContext, times( 0 ) ).register( isA( CmsResourceFilter.class ) );
    }

    private void checkResource( final Class<? extends JaxRsComponent> resourceClass )
    {
        doReturn( resourceClass ).when( resourceInfo ).getResourceClass();
        feature.configure( resourceInfo, featureContext );
        verify( featureContext, times( 1 ) ).register( isA( CmsResourceFilter.class ) );

        reset( featureContext );
    }
}
