package com.enonic.xp.app.contentstudio.json.content;

import java.time.Instant;
import java.util.List;

public record ChangeJson(String operation, List<String> fields, String user, Instant opTime)
{
}
