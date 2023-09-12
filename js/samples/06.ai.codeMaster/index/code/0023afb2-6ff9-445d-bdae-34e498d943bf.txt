import type * as React from "react";
import type { DataQuery } from "../inputs";
import type { FontType, TextColor, TextSize, TextWeight } from "./enums";
import { LogLevel, RefreshMode, SizeUnit, Spacing } from "./enums";

export interface ILocalizableString {
  readonly key: string;
  defaultValue: string;
}

export interface IMarkdownProcessingResult {
  didProcess: boolean;
  output?: JSX.Element;
}

type MandatoryStyle = { style: React.CSSProperties };

export type AllHTMLAttributes = React.AllHTMLAttributes<HTMLElement> &
  MandatoryStyle;
export type ImgHTMLAttributes = React.ImgHTMLAttributes<HTMLImageElement> &
  MandatoryStyle;
export type ButtonHTMLAttributes =
  React.ButtonHTMLAttributes<HTMLButtonElement> & MandatoryStyle;

export const enum ActionButtonState {
  Normal,
  Expanded,
  Subdued,
}

export interface IInput {
  id?: string;
  value?: any;
  valueAsString?: string;
  validateValue(): boolean;
  focus(): boolean;
  resetDirtyState(): void;
  isDirty(): boolean;
  isSet(): boolean;
  resetValue(): void;
}

export interface IImage {
  allowExpand: boolean;
  isSelectable: boolean;
}

export type TextBlockStyle = "default" | "heading" | "columnHeader";

export interface ITextProperties {
  readonly size?: TextSize;
  readonly weight?: TextWeight;
  readonly color?: TextColor;
  readonly fontType?: FontType;
  readonly isSubtle?: boolean;
  readonly wrap: boolean;
  readonly maxLines?: number;
  readonly style?: TextBlockStyle;
}

export interface IProcessableUrl {
  readonly unprocessedUrl: string;
  setProcessedUrl(value: string): void;
}

export interface IDataQueryRequest {
  searchString: string;
  dataQuery: DataQuery;
  onDataQueryCompleted: (response: IDataQueryResponse) => void;
}

export interface IDataQueryResponse {
  query: string;
  data: JSON;
  error?: string;
}

export type Refresh = {
  mode: RefreshMode;
  timeBetweenAutomaticRefreshes: number;
  maximumConsecutiveAutomaticRefreshes: number;
  allowManualRefreshesAfterAutomaticRefreshes: boolean;
};

export type AppletsSettings = {
  logEnabled: boolean;
  logLevel: LogLevel;
  maximumRetryAttempts: number;
  defaultTimeBetweenRetryAttempts: number;
  authPromptWidth: number;
  authPromptHeight: number;
  readonly refresh: Refresh;
  onLogEvent?: (
    level: LogLevel,
    message?: any,
    ...optionalParams: any[]
  ) => void;
};

export class GlobalSettings {
  static useMarkdownInRadioButtonAndCheckbox = true;
  static alwaysBleedSeparators = false;
  static enableFullJsonRoundTrip = false;
  static displayInputValidationErrors = true;
  static allowPreProcessingPropertyValues = false;
  static enableFallback = true;
  static useWebkitLineClamp = true;
  static allowMoreThanMaxActionsInOverflowMenu = false;
  static removePaddingFromContainersWithBackgroundImage = false;
  static resetInputsDirtyStateAfterActionExecution = true;
  static defaultUnlocalizableStringFallback = "Undefined";

  static readonly applets: AppletsSettings = {
    logEnabled: true,
    logLevel: LogLevel.Error,
    maximumRetryAttempts: 3,
    defaultTimeBetweenRetryAttempts: 3000, // 3 seconds
    authPromptWidth: 400,
    authPromptHeight: 600,
    refresh: {
      mode: RefreshMode.Manual,
      timeBetweenAutomaticRefreshes: 3000, // 3 seconds
      maximumConsecutiveAutomaticRefreshes: 3,
      allowManualRefreshesAfterAutomaticRefreshes: true,
    },
  };
}

export const ContentTypes = {
  applicationJson: "application/json",
  applicationXWwwFormUrlencoded: "application/x-www-form-urlencoded",
};

export interface ISeparationDefinition {
  spacing: number;
  lineThickness?: number;
  lineColor?: string;
}

export type Dictionary<T> = { [key: string]: T };

export interface ISpacingDefinition {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export class SpacingDefinition implements ISpacingDefinition {
  left = 0;
  top = 0;
  right = 0;
  bottom = 0;

  constructor(top = 0, right = 0, bottom = 0, left = 0) {
    this.top = top;
    this.right = right;
    this.bottom = bottom;
    this.left = left;
  }
}

export class PaddingDefinition {
  top: Spacing = Spacing.None;
  right: Spacing = Spacing.None;
  bottom: Spacing = Spacing.None;
  left: Spacing = Spacing.None;

  constructor(
    top: Spacing = Spacing.None,
    right: Spacing = Spacing.None,
    bottom: Spacing = Spacing.None,
    left: Spacing = Spacing.None
  ) {
    this.top = top;
    this.right = right;
    this.bottom = bottom;
    this.left = left;
  }
}

export class SizeAndUnit {
  physicalSize: number;
  unit: SizeUnit;

  static parse(input: string, requireUnitSpecifier = false): SizeAndUnit {
    const result = new SizeAndUnit(0, SizeUnit.Weight);

    if (typeof input === "number") {
      result.physicalSize = input;

      return result;
    } else if (typeof input === "string") {
      const regExp = /^([0-9]+)(px|\*)?$/g;
      const matches = regExp.exec(input);
      const expectedMatchCount = requireUnitSpecifier ? 3 : 2;

      if (matches && matches.length >= expectedMatchCount) {
        result.physicalSize = parseInt(matches[1], 10);

        if (matches.length === 3) {
          if (matches[2] === "px") {
            result.unit = SizeUnit.Pixel;
          }
        }

        return result;
      }
    }

    throw new Error(`Invalid size: ${input}`);
  }

  constructor(physicalSize: number, unit: SizeUnit) {
    this.physicalSize = physicalSize;
    this.unit = unit;
  }
}

export type HostWidth = "veryNarrow" | "narrow" | "standard" | "wide";

const orderedHostWidths: HostWidth[] = [
  "veryNarrow",
  "narrow",
  "standard",
  "wide",
];

export function compareHostWidths(
  width1: HostWidth,
  width2: HostWidth
): number {
  if (width1 === width2) {
    return 0;
  }

  const width1Index = orderedHostWidths.indexOf(width1);
  const width2Index = orderedHostWidths.indexOf(width2);

  return width1Index < width2Index ? -1 : 1;
}

export type TargetWidthCondition = "atLeast" | "atMost";

export class TargetWidth {
  static parse(input: string): TargetWidth | undefined {
    const regEx = /^(?:(atLeast|atMost):)?(veryNarrow|narrow|standard|wide)$/i;
    const matches = regEx.exec(input);

    if (matches && matches.length >= 3) {
      const result = new TargetWidth();
      const prefix = matches[1]?.toLowerCase();

      switch (prefix) {
        case "atleast":
          result.condition = "atLeast";
          break;
        case "atmost":
          result.condition = "atMost";
          break;
        case undefined:
          // No condition specified
          break;
        default:
          // Invalid condition specified
          return undefined;
      }

      const width = matches[2]?.toLowerCase();

      switch (width) {
        case "verynarrow":
          result.width = "veryNarrow";
          break;
        case "narrow":
          result.width = "narrow";
          break;
        case "standard":
          result.width = "standard";
          break;
        case "wide":
          result.width = "wide";
          break;
        default:
          return undefined;
      }

      return result;
    }

    return undefined;
  }

  constructor(
    public width: HostWidth = "wide",
    public condition?: TargetWidthCondition
  ) {}

  matches(hostWidth: HostWidth): boolean {
    if (!this.condition) {
      return this.width === hostWidth;
    }

    const targetWidthIndex = orderedHostWidths.indexOf(this.width);
    const hostWidthIndex = orderedHostWidths.indexOf(hostWidth);

    return this.condition === "atLeast"
      ? targetWidthIndex <= hostWidthIndex
      : hostWidthIndex <= targetWidthIndex;
  }

  toString(): string | undefined {
    return this.condition ? `${this.condition}:${this.width}` : this.width;
  }
}

export interface IResourceInformation {
  url: string;
  mimeType: string;
}

/**
 * Fast UUID generator, RFC4122 version 4 compliant.
 * @author Jeff Ward (jcward.com).
 * @license MIT license
 * @link http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
 **/
/* eslint-disable prefer-template, no-bitwise */
export class UUID {
  private static lut: string[] = [];

  static generate(): string {
    const d0 = (Math.random() * 0xffffffff) | 0;
    const d1 = (Math.random() * 0xffffffff) | 0;
    const d2 = (Math.random() * 0xffffffff) | 0;
    const d3 = (Math.random() * 0xffffffff) | 0;

    return (
      UUID.lut[d0 & 0xff] +
      UUID.lut[(d0 >> 8) & 0xff] +
      UUID.lut[(d0 >> 16) & 0xff] +
      UUID.lut[(d0 >> 24) & 0xff] +
      "-" +
      UUID.lut[d1 & 0xff] +
      UUID.lut[(d1 >> 8) & 0xff] +
      "-" +
      UUID.lut[((d1 >> 16) & 0x0f) | 0x40] +
      UUID.lut[(d1 >> 24) & 0xff] +
      "-" +
      UUID.lut[(d2 & 0x3f) | 0x80] +
      UUID.lut[(d2 >> 8) & 0xff] +
      "-" +
      UUID.lut[(d2 >> 16) & 0xff] +
      UUID.lut[(d2 >> 24) & 0xff] +
      UUID.lut[d3 & 0xff] +
      UUID.lut[(d3 >> 8) & 0xff] +
      UUID.lut[(d3 >> 16) & 0xff] +
      UUID.lut[(d3 >> 24) & 0xff]
    );
  }

  static initialize() {
    for (let i = 0; i < 256; i++) {
      UUID.lut[i] = (i < 16 ? "0" : "") + i.toString(16);
    }
  }
}

UUID.initialize();
/* eslint-enable prefer-template, no-bitwise */

export type RenderArgs = { [key: string]: any };

export interface IElementSpacings {
  padding: Partial<ISpacingDefinition>;
  margin: Partial<ISpacingDefinition>;
}
