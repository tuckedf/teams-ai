import type {
  BaseSerializationContext,
  PropertyBag,
  TargetVersion,
} from "./serialization";
import { SerializableObject, Version } from "./serialization";

export class HostCapabilities extends SerializableObject {
  private _capabilities: { [key: string]: TargetVersion } = {};

  protected getSchemaKey(): string {
    return "HostCapabilities";
  }

  protected internalParse(source: any, context: BaseSerializationContext) {
    super.internalParse(source, context);

    if (source) {
      // eslint-disable-next-line guard-for-in
      for (const name in source) {
        const jsonVersion = source[name];

        if (typeof jsonVersion === "string") {
          if (jsonVersion === "*") {
            this.addCapability(name, "*");
          } else {
            const version = Version.parse(jsonVersion, context);

            if (version?.isValid) {
              this.addCapability(name, version);
            }
          }
        }
      }
    }
  }

  protected internalToJSON(
    target: PropertyBag,
    context: BaseSerializationContext
  ) {
    super.internalToJSON(target, context);

    // eslint-disable-next-line guard-for-in
    for (const key in this._capabilities) {
      target[key] = this._capabilities[key];
    }
  }

  addCapability(name: string, version: TargetVersion) {
    this._capabilities[name] = version;
  }

  removeCapability(name: string) {
    delete this._capabilities[name];
  }

  clear() {
    this._capabilities = {};
  }

  hasCapability(name: string, version: TargetVersion): boolean {
    if (this._capabilities.hasOwnProperty(name)) {
      if (version === "*" || this._capabilities[name] === "*") {
        return true;
      }

      return version.compareTo(this._capabilities[name] as Version) <= 0;
    }

    return false;
  }

  areAllMet(hostCapabilities: HostCapabilities): boolean {
    for (const capabilityName in this._capabilities) {
      if (
        !hostCapabilities.hasCapability(
          capabilityName,
          this._capabilities[capabilityName]
        )
      ) {
        return false;
      }
    }

    return true;
  }
}
