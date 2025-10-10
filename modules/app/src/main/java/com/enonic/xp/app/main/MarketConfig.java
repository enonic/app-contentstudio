package com.enonic.xp.app.main;

public @interface MarketConfig
{
    String DEFAULT_MARKET_API = "https://market.enonic.com/api/graphql";

    String marketApi() default DEFAULT_MARKET_API;
}
