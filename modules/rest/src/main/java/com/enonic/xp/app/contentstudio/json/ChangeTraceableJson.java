package com.enonic.xp.app.contentstudio.json;


import java.time.Instant;

public interface ChangeTraceableJson
{
    String getCreator();

    String getModifier();

    Instant getModifiedTime();

    Instant getCreatedTime();
}
