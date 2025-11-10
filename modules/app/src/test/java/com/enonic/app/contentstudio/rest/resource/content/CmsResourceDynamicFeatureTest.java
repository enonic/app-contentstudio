package com.enonic.app.contentstudio.rest.resource.content;

import java.io.IOException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.UriInfo;

import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.project.ProjectName;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class CmsResourceDynamicFeatureTest
{
    private CmsResourceFilter filter;

    private ContainerRequestContext context;

    @BeforeEach
    public void init()
    {
        this.context = mock( ContainerRequestContext.class );
        this.filter = new CmsResourceFilter();

        ContextAccessor.current().getLocalScope().setAttribute( ProjectName.from( "myproject" ).getRepoId() );
        ContextAccessor.current().getLocalScope().setAttribute( ContentConstants.BRANCH_DRAFT );
    }

    @Test
    public void default_project()
        throws IOException
    {
        final UriInfo uriInfo = mock( UriInfo.class );
        when( uriInfo.getPath() ).thenReturn( "/admin/rest-v2/cs/content/update" );

        when( context.getUriInfo() ).thenReturn( uriInfo );
        this.filter.filter( context );

        assertEquals( "com.enonic.cms.myproject", ContextAccessor.current().getRepositoryId().toString() );
    }

    @Test
    public void set_project()
        throws IOException
    {
        final UriInfo uriInfo = mock( UriInfo.class );
        when( uriInfo.getPath() ).thenReturn( "/admin/rest-v2/cs/cms/project1/layer1/update" );

        when( context.getUriInfo() ).thenReturn( uriInfo );
        this.filter.filter( context );

        assertEquals( "com.enonic.cms.project1", ContextAccessor.current().getRepositoryId().toString() );
    }
}
