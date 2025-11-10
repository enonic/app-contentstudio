package com.enonic.app.contentstudio.rest.resource.project.json;

import java.util.List;

import com.google.common.collect.ImmutableList;

public final class ProjectsJson
{
    private final ImmutableList<ProjectJson> projects;

    public ProjectsJson( final List<ProjectJson> projects )
    {
        this.projects = ImmutableList.copyOf( projects );
    }

    public List<ProjectJson> getProjects()
    {
        return projects;
    }
}
