package com.enonic.xp.app.contentstudio.rest.resource.content.json;

import java.util.ArrayList;
import java.util.List;

public class MoveContentResultJson
{
    private final List<Success> successes = new ArrayList<>();

    private final List<Failure> failures = new ArrayList<>();

    public List<Success> getSuccesses()
    {
        return successes;
    }

    public List<Failure> getFailures()
    {
        return failures;
    }

    public void addSuccess( final String name )
    {
        successes.add( new Success( name ) );
    }

    public void addFailure( final String name, final String reason )
    {
        failures.add( new Failure( name, reason ) );
    }

    public static class Success
    {

        private final String name;

        public Success( final String name )
        {
            this.name = name;
        }

        public String getName()
        {
            return name;
        }
    }

    public static class Failure
        extends Success
    {

        private final String reason;

        public Failure( final String name, final String reason )
        {
            super( name );
            this.reason = reason;
        }

        public String getReason()
        {
            return reason;
        }
    }
}
