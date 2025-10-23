package com.enonic.app.contentstudio.rest.resource.content.json;


import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.content.ApplyContentPermissionsParams;
import com.enonic.xp.content.ApplyContentPermissionsScope;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.security.acl.AccessControlList;

public class ApplyContentPermissionsJson
{
    final ContentId contentId;

    final AccessControlList permissions;

    final AccessControlList addPermissions;

    final AccessControlList removePermissions;

    final ApplyContentPermissionsScope scope;

    @JsonCreator
    ApplyContentPermissionsJson( @JsonProperty("contentId") final String contentId,
                                 @JsonProperty("permissions") final List<AccessControlEntryJson> permissions,
                                 @JsonProperty("addPermissions") final List<AccessControlEntryJson> addPermissions,
                                 @JsonProperty("removePermissions") final List<AccessControlEntryJson> removePermissions,
                                 @JsonProperty("scope") final ApplyContentPermissionsScope scope )
    {
        this.contentId = ContentId.from( contentId );
        this.permissions = parseAcl( permissions );
        this.addPermissions = parseAcl( addPermissions );
        this.removePermissions = parseAcl( removePermissions );
        this.scope = scope;
    }

    @JsonIgnore
    public ContentId getContentId()
    {
        return contentId;
    }

    @JsonIgnore
    public AccessControlList getPermissions()
    {
        return permissions;
    }

    @JsonIgnore
    public AccessControlList getAddPermissions()
    {
        return addPermissions;
    }

    @JsonIgnore
    public AccessControlList getRemovePermissions()
    {
        return removePermissions;
    }

    @JsonIgnore
    public ApplyContentPermissionsScope getScope()
    {
        return scope;
    }

    public ApplyContentPermissionsParams toParams()
    {
        return ApplyContentPermissionsParams.create().
            contentId( this.contentId ).
            permissions( this.permissions ).addPermissions( this.addPermissions )
            .removePermissions( this.removePermissions )
            .applyPermissionsScope( this.scope )
            .
            build();
    }

    private AccessControlList parseAcl( final List<AccessControlEntryJson> accessControlListJson )
    {
        if ( accessControlListJson == null )
        {
            return AccessControlList.empty();
        }

        final AccessControlList.Builder builder = AccessControlList.create();
        for ( final AccessControlEntryJson entryJson : accessControlListJson )
        {
            builder.add( entryJson.getSourceEntry() );
        }
        return builder.build();
    }
}
