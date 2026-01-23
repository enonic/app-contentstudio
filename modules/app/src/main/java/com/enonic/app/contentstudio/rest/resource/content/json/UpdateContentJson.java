package com.enonic.app.contentstudio.rest.resource.content.json;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.app.contentstudio.json.content.MixinJson;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentName;
import com.enonic.xp.content.Mixins;
import com.enonic.xp.content.MoveContentParams;
import com.enonic.xp.content.UpdateContentParams;
import com.enonic.xp.data.PropertyArrayJson;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.data.PropertyTreeJson;

public final class UpdateContentJson
{
    final ContentName contentName;

    final UpdateContentParams updateContentParams;

    final MoveContentParams renameContentParams;

    @JsonCreator
    UpdateContentJson( @JsonProperty("contentId") final String contentId, @JsonProperty("contentName") final String contentName,
                       @JsonProperty("data") final List<PropertyArrayJson> propertyArrayJsonList,
                       @JsonProperty("meta") final List<MixinJson> extraDataJsonList,
                       @JsonProperty("displayName") final String displayName, @JsonProperty("requireValid") final String requireValid )
    {
        this.contentName = ContentName.from( contentName );

        final PropertyTree contentData = PropertyTreeJson.fromJson( propertyArrayJsonList );
        final Mixins mixins = parseMixins( extraDataJsonList );

        this.updateContentParams = new UpdateContentParams().
            requireValid( Boolean.parseBoolean( requireValid ) ).
            contentId( ContentId.from( contentId ) ).
            editor( edit -> {
                edit.data = contentData;
                edit.mixins = mixins;
                edit.displayName = displayName;
            } );

        this.renameContentParams = MoveContentParams.create().
            contentId( ContentId.from( contentId ) ).
            newName( this.contentName ).
            build();
    }

    @JsonIgnore
    public UpdateContentParams getUpdateContentParams()
    {
        return updateContentParams;
    }

    @JsonIgnore
    public MoveContentParams getRenameContentParams()
    {
        return renameContentParams;
    }


    @JsonIgnore
    public ContentName getContentName()
    {
        return contentName;
    }

    private Mixins parseMixins( final List<MixinJson> mixinJsons )
    {
        final Mixins.Builder extradatasBuilder = Mixins.create();
        for ( MixinJson mixinJson : mixinJsons )
        {
            extradatasBuilder.add( mixinJson.getMixin() );
        }
        return extradatasBuilder.build();
    }
}
