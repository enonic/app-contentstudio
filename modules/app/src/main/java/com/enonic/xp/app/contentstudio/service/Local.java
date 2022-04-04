package com.enonic.xp.app.contentstudio.service;

import org.osgi.service.component.annotations.ComponentPropertyType;

@ComponentPropertyType
public @interface Local
{
    boolean value() default true;
}
