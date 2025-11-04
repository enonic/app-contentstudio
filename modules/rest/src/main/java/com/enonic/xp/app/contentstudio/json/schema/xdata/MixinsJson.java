package com.enonic.xp.app.contentstudio.json.schema.xdata;

import java.util.ArrayList;
import java.util.List;

public class MixinsJson
{
    private final List<MixinJson> list;

    public MixinsJson()
    {
        this.list = new ArrayList<>();
    }

    public void addMixins( final List<MixinJson> mixins )
    {
        this.list.addAll( mixins );
    }

    public List<MixinJson> getMixins()
    {
        return this.list;
    }

}
