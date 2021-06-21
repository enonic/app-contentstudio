package com.enonic.xp.app.contentstudio.rest.resource;

public @interface AdminRestConfig
{
    String uploadMaxFileSize() default "10mb";
}
