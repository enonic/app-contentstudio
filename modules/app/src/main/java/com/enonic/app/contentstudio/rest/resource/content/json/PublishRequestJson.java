package com.enonic.app.contentstudio.rest.resource.content.json;

import java.util.List;
import java.util.stream.Collectors;

import com.enonic.app.contentstudio.json.issue.PublishRequestItemJson;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentIds;
import com.enonic.xp.issue.PublishRequest;
import com.enonic.xp.issue.PublishRequestItem;
import com.enonic.xp.issue.PublishRequestItems;

public class PublishRequestJson
{
    private List<String> excludeIds;

    private List<PublishRequestItemJson> items;

    public void setExcludeIds( final List<String> excludeIds )
    {
        this.excludeIds = excludeIds;
    }

    public List<String> getExcludeIds()
    {
        return excludeIds;
    }

    public List<PublishRequestItemJson> getItems()
    {
        return items;
    }

    public void setItems( final List<PublishRequestItemJson> itemsJson )
    {
        this.items = itemsJson;
    }

    public static PublishRequestJson from( final PublishRequest publishRequest )
    {
        final PublishRequestJson publishRequestJson = new PublishRequestJson();
        publishRequestJson.setExcludeIds(
            publishRequest.getExcludeIds().stream().map( ContentId::toString ).collect( Collectors.toList() ) );
        publishRequestJson.setItems(
            publishRequest.getItems().stream().map( PublishRequestItemJson::new ).collect( Collectors.toList() ) );

        return publishRequestJson;
    }

    public PublishRequest toRequest()
    {
        return PublishRequest.create().
            addExcludeIds( this.excludeIds.stream().map( ContentId::from ).collect( ContentIds.collector() ) ).
            addItems( this.items.stream().
            map( item -> PublishRequestItem.create().
            id( ContentId.from( item.getId() ) ).
            includeChildren( item.getIncludeChildren() ).build() ).
            collect(PublishRequestItems.collector() ) ).
            build();
    }
}
