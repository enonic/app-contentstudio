package com.enonic.app.contentstudio.rest.resource.content.json;


import java.time.Instant;
import java.util.List;
import java.util.Locale;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.app.contentstudio.json.content.ContentWorkflowInfoJson;
import com.enonic.app.contentstudio.json.content.ExtraDataJson;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentName;
import com.enonic.xp.content.ContentPublishInfo;
import com.enonic.xp.content.ExtraDatas;
import com.enonic.xp.content.RenameContentParams;
import com.enonic.xp.content.UpdateContentParams;
import com.enonic.xp.data.PropertyArrayJson;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.data.PropertyTreeJson;
import com.enonic.xp.security.PrincipalKey;

import static com.google.common.base.Strings.isNullOrEmpty;

public final class UpdateContentJson
{
    final ContentName contentName;

    final Instant publishFromInstant;

    final Instant publishToInstant;

    final UpdateContentParams updateContentParams;

    final RenameContentParams renameContentParams;

    @JsonCreator
    UpdateContentJson( @JsonProperty("contentId") final String contentId, @JsonProperty("contentName") final String contentName,
                       @JsonProperty("data") final List<PropertyArrayJson> propertyArrayJsonList,
                       @JsonProperty("meta") final List<ExtraDataJson> extraDataJsonList,
                       @JsonProperty("displayName") final String displayName, @JsonProperty("requireValid") final String requireValid,
                       @JsonProperty("owner") final String owner, @JsonProperty("language") final String language,
                       @JsonProperty("publishFrom") final String publishFrom, @JsonProperty("publishTo") final String publishTo,
                       @JsonProperty("workflow") final ContentWorkflowInfoJson workflowInfo )
    {
        this.contentName = ContentName.from( contentName );
        this.publishFromInstant = isNullOrEmpty( publishFrom ) ? null : Instant.parse( publishFrom );
        this.publishToInstant = isNullOrEmpty( publishTo ) ? null : Instant.parse( publishTo );

        final PropertyTree contentData = PropertyTreeJson.fromJson( propertyArrayJsonList );
        final ExtraDatas extraDatas = parseExtradata( extraDataJsonList );

        this.updateContentParams = new UpdateContentParams().
            requireValid( Boolean.parseBoolean( requireValid ) ).
            contentId( ContentId.from( contentId ) ).
            editor( edit -> {
                edit.data = contentData;
                edit.extraDatas = extraDatas;
                edit.displayName = displayName;
                edit.owner = isNullOrEmpty( owner ) ? null : PrincipalKey.from( owner );
                edit.language = isNullOrEmpty( language ) ? null : Locale.forLanguageTag( language );

                edit.publishInfo = ContentPublishInfo.create().
                    first( edit.publishInfo == null ? null : edit.publishInfo.getFirst() ).
                    from( publishFromInstant ).
                    to( publishToInstant ).
                    build();
                edit.language = isNullOrEmpty( language ) ? null : Locale.forLanguageTag( language );
                edit.workflowInfo = workflowInfo == null ? null : workflowInfo.getWorkflowInfo();
            } );

        this.renameContentParams = RenameContentParams.create().
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
    public RenameContentParams getRenameContentParams()
    {
        return renameContentParams;
    }

    @JsonIgnore
    public ContentName getContentName()
    {
        return contentName;
    }

    @JsonIgnore
    public Instant getPublishFromInstant()
    {
        return publishFromInstant;
    }

    @JsonIgnore
    public Instant getPublishToInstant()
    {
        return publishToInstant;
    }

    private ExtraDatas parseExtradata( final List<ExtraDataJson> extraDataJsonList )
    {
        final ExtraDatas.Builder extradatasBuilder = ExtraDatas.create();
        for ( ExtraDataJson extraDataJson : extraDataJsonList )
        {
            extradatasBuilder.add( extraDataJson.getExtraData() );
        }
        return extradatasBuilder.build();
    }
}
