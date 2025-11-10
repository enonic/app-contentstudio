package com.enonic.app.contentstudio.rest.resource.project.json;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;

import com.enonic.app.contentstudio.json.content.attachment.AttachmentJson;
import com.enonic.app.contentstudio.rest.resource.project.ProjectReadAccessType;
import com.enonic.xp.data.PropertyTreeJson;
import com.enonic.xp.project.Project;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.project.ProjectPermissions;

public final class ProjectJson
{
    private final String name;

    private final String displayName;

    private final String description;

    private final String language;

    private final List<String> parents;

    private final AttachmentJson icon;

    private final ProjectPermissionsJson permissions;

    private final ProjectReadAccessJson projectReadAccess;

    private final List<SiteConfigJson> siteConfigs;

    public ProjectJson( final Project project, final ProjectPermissions projectPermissions, final ProjectReadAccessType readAccessType,
                        final Locale language )
    {
        Preconditions.checkArgument( project != null, "Project cannot be null." );
        Preconditions.checkArgument( project.getName() != null, "Project name cannot be null." );

        this.name = project.getName().toString();
        this.displayName = project.getDisplayName();
        this.description = project.getDescription();
        this.icon = project.getIcon() != null ? new AttachmentJson( project.getIcon() ) : null;
        this.language = language != null ? language.toLanguageTag() : null;
        this.parents = project.getParents() != null ? project.getParents()
            .stream()
            .map( ProjectName::toString )
            .collect( Collectors.toList() ) : null;
        this.permissions = projectPermissions != null ? new ProjectPermissionsJson( projectPermissions ) : null;
        this.projectReadAccess = readAccessType != null ? new ProjectReadAccessJson( readAccessType, ImmutableList.copyOf(
            projectPermissions.getViewer().getSet() ) ) : null;
        this.siteConfigs = project.getSiteConfigs() != null ? project.getSiteConfigs().stream().map(
            siteConfig -> new SiteConfigJson( siteConfig.getApplicationKey(), PropertyTreeJson.toJson( siteConfig.getConfig() ) ) ).collect(
            Collectors.toList() ) : null;
    }

    public String getName()
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

    public AttachmentJson getIcon()
    {
        return icon;
    }

    public String getLanguage()
    {
        return language;
    }

    public List<String> getParents()
    {
        return parents;
    }

    public ProjectPermissionsJson getPermissions()
    {
        return permissions;
    }

    public ProjectReadAccessJson getReadAccess()
    {
        return projectReadAccess;
    }

    public List<SiteConfigJson> getSiteConfigs()
    {
        return siteConfigs;
    }
}
