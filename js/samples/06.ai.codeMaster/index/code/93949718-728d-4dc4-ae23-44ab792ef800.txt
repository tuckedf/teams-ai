import type {
  BaseSerializationContext,
  Dictionary,
  IInput,
  PropertyBag,
  ValidationResults,
  Version,
} from "../core";
import {
  Action,
  BoolProperty,
  ContentTypes,
  parseString,
  PropertyDefinition,
  SerializableObject,
  SerializableObjectCollectionProperty,
  StringProperty,
  Strings,
  ValidationEvent,
  Versions,
} from "../core";

export class StringWithSubstitutions {
  private _isProcessed = false;
  private _original?: string;
  private _processed?: string;

  getReferencedInputs(inputs: IInput[], referencedInputs: Dictionary<IInput>) {
    if (!referencedInputs) {
      throw new Error("The referencedInputs parameter cannot be null.");
    }

    if (this._original) {
      for (const input of inputs) {
        const matches = new RegExp(
          `\\{{2}(${input.id}).value\\}{2}`,
          "gi"
        ).exec(this._original);

        if (matches != null && input.id) {
          referencedInputs[input.id] = input;
        }
      }
    }
  }

  substituteInputValues(inputs: Dictionary<IInput>, contentType: string) {
    this._processed = this._original;

    if (this._original) {
      const regEx = /\{{2}([a-z0-9_$@]+).value\}{2}/gi;
      let matches;

      while (
        (matches = regEx.exec(this._original)) !== null &&
        this._processed
      ) {
        for (const key of Object.keys(inputs)) {
          if (key.toLowerCase() === matches[1].toLowerCase()) {
            const matchedInput = inputs[key];

            let valueForReplace = "";

            if (matchedInput.value) {
              valueForReplace = matchedInput.value;
            }

            if (contentType === ContentTypes.applicationJson) {
              valueForReplace = JSON.stringify(valueForReplace);
              valueForReplace = valueForReplace.slice(1, -1);
            } else if (
              contentType === ContentTypes.applicationXWwwFormUrlencoded
            ) {
              valueForReplace = encodeURIComponent(valueForReplace);
            }

            this._processed = this._processed.replace(
              matches[0],
              valueForReplace
            );

            break;
          }
        }
      }
    }

    this._isProcessed = true;
  }

  getOriginal(): string | undefined {
    return this._original;
  }

  get(): string | undefined {
    if (!this._isProcessed) {
      return this._original;
    } else {
      return this._processed;
    }
  }

  set(value: string | undefined) {
    this._original = value;
    this._isProcessed = false;
  }
}

class StringWithSubstitutionProperty extends PropertyDefinition {
  parse(
    _sender: SerializableObject,
    source: PropertyBag,
    _context: BaseSerializationContext
  ): StringWithSubstitutions {
    const result = new StringWithSubstitutions();
    result.set(parseString(source[this.name]));

    return result;
  }

  toJSON(
    _sender: SerializableObject,
    target: PropertyBag,
    value: StringWithSubstitutions,
    context: BaseSerializationContext
  ): void {
    context.serializeValue(target, this.name, value.getOriginal());
  }

  constructor(readonly targetVersion: Version, readonly name: string) {
    super(targetVersion, name, undefined, () => {
      return new StringWithSubstitutions();
    });
  }
}

export class HttpHeader extends SerializableObject {
  // #region Schema

  static readonly nameProperty = new StringProperty(Versions.v1_0, "name");
  static readonly valueProperty = new StringWithSubstitutionProperty(
    Versions.v1_0,
    "value"
  );

  protected getSchemaKey(): string {
    return "HttpHeader";
  }

  get name(): string {
    return this.getValue(HttpHeader.nameProperty);
  }

  set name(value: string) {
    this.setValue(HttpHeader.nameProperty, value);
  }

  private get _value(): StringWithSubstitutions {
    return this.getValue(HttpHeader.valueProperty);
  }

  private set _value(value: StringWithSubstitutions) {
    this.setValue(HttpHeader.valueProperty, value);
  }

  // #endregion

  constructor(name = "", value = "") {
    super();

    this.name = name;
    this.value = value;
  }

  getReferencedInputs(inputs: IInput[], referencedInputs: Dictionary<IInput>) {
    this._value.getReferencedInputs(inputs, referencedInputs);
  }

  prepareForExecution(inputs: Dictionary<IInput>) {
    this._value.substituteInputValues(
      inputs,
      ContentTypes.applicationXWwwFormUrlencoded
    );
  }

  get value(): string | undefined {
    return this._value.get();
  }

  set value(newValue: string | undefined) {
    this._value.set(newValue);
  }
}

export class HttpAction extends Action {
  // #region Schema

  static readonly urlProperty = new StringWithSubstitutionProperty(
    Versions.v1_0,
    "url"
  );
  static readonly bodyProperty = new StringWithSubstitutionProperty(
    Versions.v1_0,
    "body"
  );
  static readonly methodProperty = new StringProperty(Versions.v1_0, "method");
  static readonly headersProperty = new SerializableObjectCollectionProperty(
    Versions.v1_0,
    "headers",
    (_) => new HttpHeader()
  );
  static readonly ignoreInputValidationProperty = new BoolProperty(
    Versions.v1_3,
    "ignoreInputValidation",
    false
  );

  private get _url(): StringWithSubstitutions {
    return this.getValue(HttpAction.urlProperty);
  }

  private set _url(value: StringWithSubstitutions) {
    this.setValue(HttpAction.urlProperty, value);
  }

  private get _body(): StringWithSubstitutions {
    return this.getValue(HttpAction.bodyProperty);
  }

  private set _body(value: StringWithSubstitutions) {
    this.setValue(HttpAction.bodyProperty, value);
  }

  private get _ignoreInputValidation(): boolean {
    return this.getValue(HttpAction.ignoreInputValidationProperty);
  }

  private set _ignoreInputValidation(value: boolean) {
    this.setValue(HttpAction.ignoreInputValidationProperty, value);
  }

  get method(): string | undefined {
    return this.getValue(HttpAction.methodProperty);
  }

  set method(value: string | undefined) {
    this.setValue(HttpAction.methodProperty, value);
  }

  get headers(): HttpHeader[] {
    return this.getValue(HttpAction.headersProperty);
  }

  set headers(value: HttpHeader[]) {
    this.setValue(HttpAction.headersProperty, value);
  }

  // #endregion

  // Note the "weird" way this field is declared is to work around a breaking
  // change introduced in TS 3.1 wrt d.ts generation. DO NOT CHANGE
  static readonly JsonTypeName: "Action.Http" = "Action.Http";

  protected internalGetReferencedInputs(): Dictionary<IInput> {
    const allInputs = this.parent
      ? this.parent.getRootObject().getAllInputs()
      : [];
    const result: Dictionary<IInput> = {};

    this._url.getReferencedInputs(allInputs, result);

    for (const header of this.headers) {
      header.getReferencedInputs(allInputs, result);
    }

    this._body.getReferencedInputs(allInputs, result);

    return result;
  }

  protected internalPrepareForExecution(
    inputs: Dictionary<IInput> | undefined
  ) {
    if (inputs) {
      this._url.substituteInputValues(
        inputs,
        ContentTypes.applicationXWwwFormUrlencoded
      );

      let contentType = ContentTypes.applicationJson;

      for (const header of this.headers) {
        header.prepareForExecution(inputs);

        if (header.name && header.name.toLowerCase() === "content-type") {
          contentType = header.value ?? "";
        }
      }

      this._body.substituteInputValues(inputs, contentType);
    }
  }

  getJsonTypeName(): string {
    return HttpAction.JsonTypeName;
  }

  internalValidateProperties(context: ValidationResults) {
    super.internalValidateProperties(context);

    if (!this.url) {
      context.addFailure(
        this,
        ValidationEvent.PropertyCantBeNull,
        Strings.errors.propertyMustBeSet("url")
      );
    }

    if (this.headers.length > 0) {
      for (const header of this.headers) {
        if (!header.name) {
          context.addFailure(
            this,
            ValidationEvent.PropertyCantBeNull,
            Strings.errors.actionHttpHeadersMustHaveNameAndValue()
          );
        }
      }
    }
  }

  get ignoreInputValidation(): boolean {
    return this._ignoreInputValidation;
  }

  set ignoreInputValidation(value: boolean) {
    this._ignoreInputValidation = value;
  }

  get url(): string | undefined {
    return this._url.get();
  }

  set url(value: string | undefined) {
    this._url.set(value);
  }

  get body(): string | undefined {
    return this._body.get();
  }

  set body(value: string | undefined) {
    this._body.set(value);
  }
}
