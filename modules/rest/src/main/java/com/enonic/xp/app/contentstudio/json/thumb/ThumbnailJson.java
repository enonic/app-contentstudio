package com.enonic.xp.app.contentstudio.json.thumb;


import com.enonic.xp.icon.Thumbnail;

@SuppressWarnings("UnusedDeclaration")
public class ThumbnailJson
{
    private final String binaryReference;

    private final long size;

    private final String mimeType;

    public ThumbnailJson( final Thumbnail thumbnail )
    {
        this.binaryReference = thumbnail.getBinaryReference().toString();
        this.size = thumbnail.getSize();
        this.mimeType = thumbnail.getMimeType();
    }

    public String getBinaryReference()
    {
        return binaryReference;
    }

    public long getSize()
    {
        return size;
    }

    public String getMimeType()
    {
        return this.mimeType;
    }
}
