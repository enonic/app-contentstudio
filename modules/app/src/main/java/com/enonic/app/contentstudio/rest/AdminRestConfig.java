package com.enonic.app.contentstudio.rest;

public @interface AdminRestConfig
{
    String uploadMaxFileSize() default "100mb";

    String contentTypePatternMode() default "MATCH";

    boolean contentSecurityPolicy_enabled() default true;
}
