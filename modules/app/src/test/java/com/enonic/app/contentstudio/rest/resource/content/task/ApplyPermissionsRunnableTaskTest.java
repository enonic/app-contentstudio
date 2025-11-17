package com.enonic.app.contentstudio.rest.resource.content.task;

import com.enonic.xp.content.*;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.acl.AccessControlEntry;
import com.enonic.xp.security.acl.AccessControlList;
import com.enonic.xp.task.SubmitLocalTaskParams;
import com.enonic.xp.task.TaskId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.concurrent.Callable;

import static com.enonic.xp.security.acl.Permission.READ;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;

public class ApplyPermissionsRunnableTaskTest
    extends AbstractRunnableTaskTest
{
    private ApplyContentPermissionsParams params;

    @BeforeEach
    public void setUp()
        throws Exception
    {
        this.params = ApplyContentPermissionsParams.create().
            contentId( ContentId.from( "content-id" ) ).
            permissions( getTestPermissions() ).
            build();

        final FindContentIdsByParentResult res =
            FindContentIdsByParentResult.create().contentIds( ContentIds.from( "content-id" ) ).totalHits( 1 ).build();
        Mockito.when( this.contentService.findIdsByParent( Mockito.isA( FindContentByParentParams.class ) ) ).thenReturn( res );
        Mockito.when( this.contentService.update( Mockito.isA( UpdateContentParams.class ) ) ).thenReturn( this.contents.get( 0 ) );
    }

    @Override
    protected ApplyPermissionsRunnableTask createAndRunTask()
    {
        final ApplyPermissionsRunnableTask task = ApplyPermissionsRunnableTask.create().
            params( params ).
            description( "Apply permissions" ).
            taskService( taskService ).
            contentService( contentService ).
            build();

        task.run( TaskId.from( "taskId" ), progressReporter );

        return task;
    }

    @Test
    public void message_empty()
        throws Exception
    {
        Mockito.when( this.contentService.applyPermissions( Mockito.isA( ApplyContentPermissionsParams.class ) ) )
            .thenReturn( ApplyContentPermissionsResult.create().build() );

        final ApplyPermissionsRunnableTask task = createAndRunTask();
        task.createTaskResult();

        Mockito.verify( progressReporter, Mockito.times( 1 ) ).info( contentQueryArgumentCaptor.capture() );
        Mockito.verify( taskService, Mockito.times( 1 ) ).submitLocalTask( any( SubmitLocalTaskParams.class ) );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 0 );

        assertEquals( "{\"state\":\"WARNING\",\"message\":\"Nothing to apply.\"}", resultMessage );
    }

    @Test
    public void message_multiple_success()
        throws Exception
    {
        Mockito.when( this.contentService.applyPermissions( Mockito.isA( ApplyContentPermissionsParams.class ) ) )
            .thenReturn( ApplyContentPermissionsResult.create()
                    .addResult(this.contents.get(0).getId(), this.contents.get(0).getPermissions())
                    .addResult(this.contents.get(1).getId(), this.contents.get(1).getPermissions())
                             .build() );

        final ApplyPermissionsRunnableTask task = executeInContext( this::createAndRunTask );
        task.createTaskResult();

        Mockito.verify( progressReporter, Mockito.times( 1 ) ).info( contentQueryArgumentCaptor.capture() );
        Mockito.verify( taskService, Mockito.times( 1 ) ).submitLocalTask( any( SubmitLocalTaskParams.class ) );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 0 );

        assertEquals( "{\"state\":\"SUCCESS\",\"message\":\"Permissions for 2 items have been applied.\"}", resultMessage );
    }

    @Test
    public void single_success()
        throws Exception
    {
        Mockito.when( this.contentService.applyPermissions( Mockito.isA( ApplyContentPermissionsParams.class ) ) )
            .thenReturn( ApplyContentPermissionsResult.create()
                    .addResult(this.contents.get(0).getId(), this.contents.get(0).getPermissions())
                             .build() );

        final ApplyPermissionsRunnableTask task = executeInContext( this::createAndRunTask );
        task.createTaskResult();

        Mockito.verify( progressReporter, Mockito.times( 1 ) ).info( contentQueryArgumentCaptor.capture() );
        Mockito.verify( taskService, Mockito.times( 1 ) ).submitLocalTask( any( SubmitLocalTaskParams.class ) );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 0 );

        assertEquals("{\"state\":\"SUCCESS\",\"message\":\"Permissions have been applied.\"}", resultMessage);
    }

    @Test
    public void create_message_single_failed()
        throws Exception
    {
        Mockito.when( this.contentService.applyPermissions( Mockito.isA( ApplyContentPermissionsParams.class ) ) )
            .thenReturn( ApplyContentPermissionsResult.create()
                    .addResult(this.contents.get(0).getId(), null)
                             .build() );

        final ApplyPermissionsRunnableTask task = executeInContext( this::createAndRunTask );
        task.createTaskResult();

        Mockito.verify( progressReporter, Mockito.times( 1 ) ).info( contentQueryArgumentCaptor.capture() );
        Mockito.verify( taskService, Mockito.times( 1 ) ).submitLocalTask( any( SubmitLocalTaskParams.class ) );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 0 );

        assertEquals("{\"state\":\"ERROR\",\"message\":\"Permissions could not be applied.\"}", resultMessage);
    }

    @Test
    public void create_message_single_root_failed()
        throws Exception
    {

        Mockito.when( this.contentService.applyPermissions( Mockito.isA( ApplyContentPermissionsParams.class ) ) )
            .thenReturn( ApplyContentPermissionsResult.create()
                    .addResult(ContentId.from("root-content-id"), null)
                             .build() );

        final ApplyPermissionsRunnableTask task = executeInContext( this::createAndRunTask );
        task.createTaskResult();

        Mockito.verify( progressReporter, Mockito.times( 1 ) ).info( contentQueryArgumentCaptor.capture() );
        Mockito.verify( taskService, Mockito.times( 1 ) ).submitLocalTask( any( SubmitLocalTaskParams.class ) );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 0 );

        assertEquals("{\"state\":\"ERROR\",\"message\":\"Permissions could not be applied.\"}",
                      resultMessage );
    }


    @Test
    public void create_message_multiple_failed_and_one_succeed()
        throws Exception
    {

        Mockito.when( this.contentService.applyPermissions( Mockito.isA( ApplyContentPermissionsParams.class ) ) ).
            thenReturn( ApplyContentPermissionsResult.
                    create().addResult(this.contents.get(0).getId(), this.contents.get(0).getPermissions())
                    .addResult(this.contents.get(1).getId(), null)
                    .addResult(this.contents.get(2).getId(), null)
                            .
                build() );

        final ApplyPermissionsRunnableTask task = executeInContext( this::createAndRunTask );
        task.createTaskResult();

        Mockito.verify( progressReporter, Mockito.times( 1 ) ).info( contentQueryArgumentCaptor.capture() );
        Mockito.verify( taskService, Mockito.times( 1 ) ).submitLocalTask( any( SubmitLocalTaskParams.class ) );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 0 );

        assertEquals(
                "{\"state\":\"WARNING\",\"message\":\"Permissions have been applied. Failed to apply permissions for 2 items. \"}",
            resultMessage );
    }

    private AccessControlList getTestPermissions()
    {
        return AccessControlList.of( AccessControlEntry.create().principal( PrincipalKey.from( "user:system:admin" ) ).allowAll().build(),
                                     AccessControlEntry.create().principal( PrincipalKey.ofAnonymous() ).allow( READ ).build() );
    }

    private <T> T executeInContext( final Callable<T> callable )
    {
        return ContextBuilder.from( ContextAccessor.current() ).branch( ContentConstants.BRANCH_DRAFT ).build().callWith( callable );
    }
}
