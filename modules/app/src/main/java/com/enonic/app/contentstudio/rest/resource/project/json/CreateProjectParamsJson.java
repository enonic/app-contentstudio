package com.enonic.app.contentstudio.rest.resource.project.json;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.app.contentstudio.rest.resource.project.ProjectReadAccess;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.site.SiteConfig;

public final class CreateProjectParamsJson
{
    private final ProjectName name;

    private final String displayName;

    private final String description;

    private final List<ProjectName> parents;

    private final ProjectReadAccess readAccess;

    private final List<SiteConfig> applicationConfigs;

    @JsonCreator
    CreateProjectParamsJson( @JsonProperty("name") final String name, @JsonProperty("displayName") final String displayName,
                             @JsonProperty("description") final String description, @JsonProperty("parents") final List<String> parents,
                             @JsonProperty("readAccess") final ProjectReadAccessJson readAccess,
                             @JsonProperty("applicationConfigs") final List<SiteConfigParamsJson> applicationConfigs )
    {
        this.name = ProjectName.from( name );
        this.displayName = displayName;
        this.description = description;
        this.parents = parents != null ? parents.stream().map( ProjectName::from ).collect( Collectors.toList() ) : new ArrayList<>();
        this.readAccess = readAccess != null ? readAccess.getProjectReadAccess() : null;
        this.applicationConfigs = applicationConfigs != null ? applicationConfigs.stream()
            .map( siteConfigParamsJson -> siteConfigParamsJson.getSiteConfig() )
            .collect( Collectors.toList() ) : new ArrayList<>();
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

    public List<ProjectName> getParents()
    {
        return parents;
    }

    public ProjectReadAccess getReadAccess()
    {
        return readAccess;
    }

    public List<SiteConfig> getApplicationConfigs()
    {
        return applicationConfigs;
    }

}
