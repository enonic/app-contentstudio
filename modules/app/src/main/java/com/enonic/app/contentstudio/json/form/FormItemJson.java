package com.enonic.app.contentstudio.json.form;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import com.enonic.xp.form.FormItem;


@SuppressWarnings("UnusedDeclaration")
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "formItemType")
@JsonSubTypes({@JsonSubTypes.Type(value = InputJson.class, name = "Input"),
    @JsonSubTypes.Type(value = FormItemSetJson.class, name = "ItemSet"),
    @JsonSubTypes.Type(value = FieldSetJson.class, name = "Layout"),
    @JsonSubTypes.Type(value = FormFragmentJson.class, name = "FormFragment"),
    @JsonSubTypes.Type(value = FormOptionSetJson.class, name = "OptionSet")})
public abstract class FormItemJson<T extends FormItem>
{
    public abstract String getName();

    @JsonIgnore
    public abstract T getFormItem();

}
