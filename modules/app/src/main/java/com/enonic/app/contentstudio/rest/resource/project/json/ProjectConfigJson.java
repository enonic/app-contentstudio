package com.enonic.app.contentstudio.rest.resource.project.json;

public final class ProjectConfigJson
{
    private final boolean multiInheritance;

    public ProjectConfigJson( final boolean multiInheritance )
    {
        this.multiInheritance = multiInheritance;
    }

    public boolean isMultiInheritance()
    {
        return multiInheritance;
    }
}
