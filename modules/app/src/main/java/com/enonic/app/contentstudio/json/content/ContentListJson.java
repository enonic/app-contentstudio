package com.enonic.app.contentstudio.json.content;

import com.enonic.app.contentstudio.rest.resource.content.ContentListMetaData;
import com.enonic.xp.content.Content;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

public class ContentListJson<T extends ContentIdJson>
{
    private final ContentListMetaDataJson metadata;

    private final List<T> contents;

    public ContentListJson( final Iterable<? extends Content> contents, ContentListMetaData contentListMetaData,
                            final Function<Content, T> createItemFunction )
    {
        this.metadata = new ContentListMetaDataJson( contentListMetaData );
        this.contents = StreamSupport.stream( contents.spliterator(), false ).map( createItemFunction ).collect( Collectors.toUnmodifiableList() );
    }

    public List<T> getContents()
    {
        return contents;
    }

    public ContentListMetaDataJson getMetadata()
    {
        return metadata;
    }
}
