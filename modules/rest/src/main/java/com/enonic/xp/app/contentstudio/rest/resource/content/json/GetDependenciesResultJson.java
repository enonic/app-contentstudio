package com.enonic.xp.app.contentstudio.rest.resource.content.json;

import java.util.Map;

import com.enonic.xp.app.contentstudio.json.content.DependenciesJson;


public class GetDependenciesResultJson
{
    public GetDependenciesResultJson( final Map<String, DependenciesJson> dependencies )
    {
        this.dependencies = dependencies;
    }

    public Map<String, DependenciesJson> dependencies;

    public Map<String, DependenciesJson> getDependencies()
    {
        return dependencies;
    }

    public void setDependencies( final Map<String, DependenciesJson> dependencies )
    {
        this.dependencies = dependencies;
    }
}
