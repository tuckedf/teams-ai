export class ContainerStyle {
  static readonly Default: "default" = "default";
  static readonly Emphasis: "emphasis" = "emphasis";
  static readonly Accent: "accent" = "accent";
  static readonly Good: "good" = "good";
  static readonly Attention: "attention" = "attention";
  static readonly Warning: "warning" = "warning";
}

export enum ActionStyle {
  Default = "default",
  Positive = "positive",
  Destructive = "destructive",
}

export enum ActionMode {
  Primary = "primary",
  Secondary = "secondary",
}

export enum Size {
  Auto,
  Stretch,
  Small,
  Medium,
  Large,
}

export enum ImageSize {
  Small,
  Medium,
  Large,
}

export enum SizeUnit {
  Weight,
  Pixel,
}

export enum TextSize {
  Small,
  Default,
  Medium,
  Large,
  ExtraLarge,
}

export enum TextWeight {
  Lighter,
  Default,
  Bolder,
}

export enum FontType {
  Default,
  Monospace,
}

export enum Spacing {
  None,
  Small,
  Default,
  Medium,
  Large,
  ExtraLarge,
  Padding,
}

export enum TextColor {
  Default,
  Dark,
  Light,
  Accent,
  Good,
  Warning,
  Attention,
}

export enum HorizontalAlignment {
  Left,
  Center,
  Right,
}

export enum VerticalAlignment {
  Top,
  Center,
  Bottom,
}

export enum ActionAlignment {
  Left,
  Center,
  Right,
  Stretch,
}

export enum ImageStyle {
  Default,
  Person,
}

export enum ShowCardActionMode {
  Inline,
  Popup,
}

export enum Orientation {
  Horizontal,
  Vertical,
}

export enum FillMode {
  Cover,
  RepeatHorizontally,
  RepeatVertically,
  Repeat,
}

export enum ActionIconPlacement {
  LeftOfTitle,
  AboveTitle,
}

export enum InputTextStyle {
  Text,
  Tel,
  Url,
  Email,
  Password,
}

export enum ValidationPhase {
  Parse,
  ToJSON,
  Validation,
}

export enum ValidationEvent {
  Hint,
  ActionTypeNotAllowed,
  CollectionCantBeEmpty,
  Deprecated,
  ElementTypeNotAllowed,
  InteractivityNotAllowed,
  InvalidPropertyValue,
  MissingCardType,
  PropertyCantBeNull,
  TooManyActions,
  UnknownActionType,
  UnknownElementType,
  UnsupportedCardVersion,
  DuplicateId,
  UnsupportedProperty,
  RequiredInputsShouldHaveLabel,
  RequiredInputsShouldHaveErrorMessage,
  Other,
}

export enum TypeErrorType {
  UnknownType,
  ForbiddenType,
}

export enum RefreshMode {
  Disabled,
  Manual,
  Automatic,
}

export enum LogLevel {
  Info,
  Warning,
  Error,
}

export enum ThemeName {
  Light,
  Dark,
}
