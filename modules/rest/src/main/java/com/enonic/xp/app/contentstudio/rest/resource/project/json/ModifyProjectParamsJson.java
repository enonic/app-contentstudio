package com.enonic.xp.app.contentstudio.rest.resource.project.json;

import java.util.List;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.project.ProjectName;

public final class ModifyProjectParamsJson
{
    private final ProjectName name;

    private final String displayName;

    private final String description;

    private final List<ApplicationKey> applicationKeys;

    @JsonCreator
    ModifyProjectParamsJson( @JsonProperty("name") final String name, @JsonProperty("displayName") final String displayName,
                             @JsonProperty("description") final String description,
                             @JsonProperty("applications") final List<String> applications )
    {
        this.name = ProjectName.from( name );
        this.displayName = displayName;
        this.description = description;
        this.applicationKeys =
            applications != null ? applications.stream().map( ApplicationKey::from ).collect( Collectors.toList() ) : null;
    }

    public ProjectName getName()
    {
        return name;
    }

    public String getDisplayName()
    {
        return displayName;
    }

    public String getDescription()
    {
        return description;
    }

    public List<ApplicationKey> getApplicationKeys()
    {
        return applicationKeys;
    }
}
