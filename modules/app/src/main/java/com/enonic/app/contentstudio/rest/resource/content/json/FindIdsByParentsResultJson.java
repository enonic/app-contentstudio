package com.enonic.app.contentstudio.rest.resource.content.json;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.enonic.app.contentstudio.json.content.ContentIdJson;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentIds;

public class FindIdsByParentsResultJson
{
    private final List<ContentIdJson> ids;

    private final Map<String, List<String>> idsByParent;

    private FindIdsByParentsResultJson( Builder builder )
    {
        ids = builder.ids.stream().map( ContentIdJson::new ).collect( Collectors.toList() );
        idsByParent = new LinkedHashMap<>();
        builder.idsByParent.forEach( ( parentId, childrenIds ) -> idsByParent.put( parentId.toString(), childrenIds.stream()
            .map( ContentId::toString )
            .collect( Collectors.toList() ) ) );
    }

    public static Builder create()
    {
        return new Builder();
    }

    @SuppressWarnings("unused")
    public List<ContentIdJson> getIds()
    {
        return ids;
    }

    @SuppressWarnings("unused")
    public Map<String, List<String>> getIdsByParent()
    {
        return idsByParent;
    }

    public static final class Builder
    {

        private ContentIds ids;

        private Map<ContentId, ContentIds> idsByParent = Map.of();

        private Builder()
        {
        }

        public Builder setRequestedContents( final ContentIds ids )
        {
            this.ids = ids;
            return this;
        }

        public Builder setIdsByParent( final Map<ContentId, ContentIds> idsByParent )
        {
            this.idsByParent = idsByParent;
            return this;
        }

        public FindIdsByParentsResultJson build()
        {
            return new FindIdsByParentsResultJson( this );
        }
    }
}
