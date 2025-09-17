package com.enonic.xp.app.main;

public @interface MarketConfig
{
    String DEFAULT_MARKET_URL = "https://market.enonic.com/applications";

    String marketUrl() default DEFAULT_MARKET_URL;
}
