package com.enonic.xp.app.main;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;

@Component(immediate = true, service = MarketConfigService.class, configurationPid = "com.enonic.xp.market")
public class MarketConfigService
{

    private final String marketUrl;

    @Activate
    public MarketConfigService( final MarketConfig marketConfig )
    {
        this.marketUrl = marketConfig.marketUrl();
    }

    public String getMarketUrl()
    {
        return marketUrl;
    }

}
