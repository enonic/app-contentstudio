package com.enonic.xp.app.contentstudio.rest.resource.content.task;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentPath;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class MoveTaskMessageGeneratorTest
{
    private MoveTaskMessageGenerator generator;

    @BeforeEach
    public void setUp()
        throws Exception
    {
        this.generator = new MoveTaskMessageGenerator();
    }

    @Test
    public void test_1success()
    {

        final MoveRunnableTaskResult result = MoveRunnableTaskResult.create().
            succeeded( "moved-1" ).
            build();

        final String message = generator.generate( result );

        assertEquals( "Item \"moved-1\" is moved.", message );
    }

    @Test
    public void test_3success_desc_single()
    {

        final MoveRunnableTaskResult result = MoveRunnableTaskResult.create().
            succeeded( "moved-1" ).
            succeeded( "moved-2" ).
            alreadyMoved( ContentPath.from( "already-moved-3" ) ).
            build();

        final String message = generator.generate( result );

        assertEquals( "3 items were moved ( Already moved: \"already-moved-3\" ).", message );
    }

    @Test
    public void test_3success_1fail_desc_multi()
    {

        final MoveRunnableTaskResult result = MoveRunnableTaskResult.create().
            succeeded( "moved-1" ).
            destination( ContentPath.ROOT ).
            alreadyMoved( ContentPath.from( "already-moved-2" ) ).
            alreadyMoved( ContentPath.from( "already-moved-3" ) ).
            accessFailed( ContentPath.ROOT ).
            build();

        final String message = generator.generate( result );

        assertEquals( "3 items were moved ( Already moved: 2 ). You don't have permissions to move to \"/\".", message );
    }

    @Test
    public void test_1fail()
    {

        final MoveRunnableTaskResult result = MoveRunnableTaskResult.create().
            destination( ContentPath.from( "dest/path" ) ).
            existsFailed( ContentPath.from( "exists-1" ) ).
            build();

        final String message = generator.generate( result );

        assertEquals( "Item \"exists-1\" already exists at \"dest/path\".", message );
    }

    @Test
    public void test_4fail_desc_single()
    {

        final MoveRunnableTaskResult result = MoveRunnableTaskResult.create().
            destination( ContentPath.from( "dest/path" ) ).
            existsFailed( ContentPath.from( "exists-1" ) ).
            accessFailed( ContentPath.from( "access-2" ) ).
            notExistsFailed( ContentId.from(  "not-exists-3" ) ) .
            failed( ContentPath.from( "failed-4" ) ).
            build();

        final String message = generator.generate( result );

        assertEquals(
            "Failed to move 4 items ( Exist at destination: \"exists-1\", Not found: \"not-exists-3\", Access denied: \"access-2\" ).",
            message );
    }

    @Test
    public void test_8fail_desc_multi()
    {

        final MoveRunnableTaskResult result = MoveRunnableTaskResult.create().
            destination( ContentPath.from( "dest/path" ) ).
            existsFailed( ContentPath.from( "exists-1" ) ).
            existsFailed( ContentPath.from( "exists-2" ) ).
            accessFailed( ContentPath.from( "access-3" ) ).
            accessFailed( ContentPath.from( "access-4" ) ).
            notExistsFailed( ContentId.from( "not-exists-5" ) ).
            notExistsFailed( ContentId.from( "not-exists-6" ) ).
            failed( ContentPath.from( "failed-7" ) ).
            failed( ContentPath.from( "failed-8" ) ).
            build();

        final String message = generator.generate( result );

        assertEquals( "Failed to move 8 items ( Exist at destination: 2, Not found: 2, Access denied: 2 ).", message );
    }
}
