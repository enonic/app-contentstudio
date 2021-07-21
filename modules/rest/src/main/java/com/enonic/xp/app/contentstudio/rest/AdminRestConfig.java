package com.enonic.xp.app.contentstudio.rest;

public @interface AdminRestConfig
{
    String uploadMaxFileSize() default "100mb";

    String contentTypePatternMode() default "MATCH";
}
