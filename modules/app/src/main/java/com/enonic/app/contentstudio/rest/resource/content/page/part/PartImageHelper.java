package com.enonic.app.contentstudio.rest.resource.content.page.part;


import com.enonic.app.contentstudio.rest.resource.BaseImageHelper;

public class PartImageHelper
    extends BaseImageHelper
{
    private final byte[] defaultPartImage;


    public PartImageHelper()
    {
        defaultPartImage = loadDefaultImage( "part" );
    }

    public byte[] getDefaultPartImage()
    {
        return defaultPartImage;
    }

}
