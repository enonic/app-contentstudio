package com.enonic.app.contentstudio.json.content;

import java.util.Set;

public record CompareContentResultJson(String id, Set<String> diff)
{
}
