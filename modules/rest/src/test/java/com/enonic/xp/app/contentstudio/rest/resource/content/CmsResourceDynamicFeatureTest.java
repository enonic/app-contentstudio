package com.enonic.xp.app.contentstudio.rest.resource.content;

import java.io.IOException;

import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.UriInfo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.project.ProjectName;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class CmsResourceDynamicFeatureTest
{
    private CmsResourceFilter filter;

    private ContainerRequestContext context;

    @BeforeEach
    public void init()
    {
        this.context = Mockito.mock( ContainerRequestContext.class );
        this.filter = new CmsResourceFilter();

        ContextAccessor.current().getLocalScope().setAttribute( ProjectName.from( "myproject" ).getRepoId() );
        ContextAccessor.current().getLocalScope().setAttribute( ContentConstants.BRANCH_DRAFT );
    }

    @Test
    public void default_project()
        throws IOException
    {
        final UriInfo uriInfo = Mockito.mock( UriInfo.class );
        Mockito.when( uriInfo.getPath() ).thenReturn( "/admin/rest-v2/cs/content/update" );

        Mockito.when( context.getUriInfo() ).thenReturn( uriInfo );
        this.filter.filter( context );

        assertEquals( "com.enonic.cms.myproject", ContextAccessor.current().getRepositoryId().toString() );
    }

    @Test
    public void set_project()
        throws IOException
    {
        final UriInfo uriInfo = Mockito.mock( UriInfo.class );
        Mockito.when( uriInfo.getPath() ).thenReturn( "/admin/rest-v2/cs/cms/project1/layer1/update" );

        Mockito.when( context.getUriInfo() ).thenReturn( uriInfo );
        this.filter.filter( context );

        assertEquals( "com.enonic.cms.project1", ContextAccessor.current().getRepositoryId().toString() );
    }
}
