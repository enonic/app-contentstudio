package com.enonic.app.contentstudio.rest.resource.content.json;

import java.util.List;
import java.util.stream.Collectors;

import com.enonic.app.contentstudio.json.content.ContentIdJson;
import com.enonic.xp.content.ContentIds;

public class FindIdsByParentsResultJson
{
    private final List<ContentIdJson> ids;

    private FindIdsByParentsResultJson( Builder builder )
    {
        ids = builder.ids.stream().map( ContentIdJson::new ).collect( Collectors.toList() );
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

    public static final class Builder
    {

        private ContentIds ids;

        private Builder()
        {
        }

        public Builder setRequestedContents( final ContentIds ids )
        {
            this.ids = ids;
            return this;
        }

        public FindIdsByParentsResultJson build()
        {
            return new FindIdsByParentsResultJson( this );
        }
    }
}
