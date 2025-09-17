package com.enonic.xp.app.main;

import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;

import java.util.function.Supplier;

public final class GetMarketConfigBean
    implements ScriptBean
{
    private Supplier<MarketConfigService> marketConfigSupplier;

    @Override
    public void initialize( final BeanContext context )
    {
        this.marketConfigSupplier = context.getService( MarketConfigService.class );
    }

    public String getMarketUrl()
    {
        if ( marketConfigSupplier.get() != null )
        {
            return marketConfigSupplier.get().getMarketUrl();
        }

        return MarketConfig.DEFAULT_MARKET_URL;
    }
}
