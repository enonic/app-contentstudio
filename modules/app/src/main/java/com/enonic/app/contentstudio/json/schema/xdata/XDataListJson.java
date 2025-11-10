package com.enonic.app.contentstudio.json.schema.xdata;

import java.util.ArrayList;
import java.util.List;

public class XDataListJson
{
    private final List<XDataJson> list;

    public XDataListJson()
    {
        this.list = new ArrayList<>();
    }

    public void addXDatas( final List<XDataJson> xDatas )
    {
        this.list.addAll( xDatas );
    }

    public List<XDataJson> getXDatas()
    {
        return this.list;
    }

}
