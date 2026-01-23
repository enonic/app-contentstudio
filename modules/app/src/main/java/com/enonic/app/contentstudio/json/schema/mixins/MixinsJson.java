package com.enonic.app.contentstudio.json.schema.mixins;

import java.util.ArrayList;
import java.util.List;

public class MixinsJson
{
    private final List<MixinDescriptorJson> list;

    public MixinsJson()
    {
        this.list = new ArrayList<>();
    }

    public void addMixins( final List<MixinDescriptorJson> xDatas )
    {
        this.list.addAll( xDatas );
    }

    public List<MixinDescriptorJson> getMixins()
    {
        return this.list;
    }

}
