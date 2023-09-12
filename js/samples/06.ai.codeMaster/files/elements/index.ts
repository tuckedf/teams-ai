import { GlobalRegistry, Versions } from "../core";
import { ActionSet } from "./action-set";
import { ColumnSet } from "./column-set";
import { Container } from "./container";
import { FactSet } from "./fact-set";
import { Image } from "./image";
import { ImageSet } from "./image-set";
import { Media } from "./media";
import { RichTextBlock } from "./rich-text-block";
import { ShowCardAction } from "./show-card-action";
import { Table } from "./table";
import { TextBlock } from "./text-block";
import { TextRun } from "./text-run";

export { ActionSet } from "./action-set";
export {
  AdaptiveCard,
  AuthCardButton,
  Authentication,
  RefreshActionProperty,
  RefreshDefinition,
  TokenExchangeResource,
} from "./adaptive-card";
export { CardElementContainer } from "./card-element-container";
export { Column, ColumnSet } from "./column-set";
export type { ColumnWidth } from "./column-set";
export { Component } from "./component";
export {
  BackgroundImage,
  Container,
  ContainerBase,
  ContainerStyleProperty,
  StylableCardElementContainer,
} from "./container";
export { ContainerWithActions } from "./container-with-actions";
export { Fact, FactSet } from "./fact-set";
export { Image } from "./image";
export { ImageSet } from "./image-set";
export {
  CaptionSource,
  ContentSource,
  CustomMediaPlayer,
  DailymotionPlayer,
  HTML5MediaPlayer,
  IFrameMediaMediaPlayer,
  Media,
  MediaBase,
  MediaPlayer,
  MediaSource,
  VimeoPlayer,
  YouTubePlayer,
} from "./media";
export type { ICustomMediaPlayer } from "./media";
export { RichTextBlock } from "./rich-text-block";
export { ShowCardAction } from "./show-card-action";
export {
  StylableContainer,
  Table,
  TableCell,
  TableColumnDefinition,
  TableRow,
} from "./table";
export type { CellType } from "./table";
export { BaseTextBlock, TextBlock } from "./text-block";
export { TextRun } from "./text-run";

export function registerDefaultElements() {
  GlobalRegistry.defaultElements.register("Container", (_) => new Container());
  GlobalRegistry.defaultElements.register(
    "ActionSet",
    (_) => new ActionSet(),
    Versions.v1_2
  );
  GlobalRegistry.defaultElements.register("ColumnSet", (_) => new ColumnSet());
  GlobalRegistry.defaultElements.register(
    "Media",
    (_) => new Media(),
    Versions.v1_1
  );
  GlobalRegistry.defaultElements.register(
    "RichTextBlock",
    (_) => new RichTextBlock(),
    Versions.v1_2
  );
  GlobalRegistry.defaultElements.register(
    "Table",
    (_) => new Table(),
    Versions.v1_5
  );
  GlobalRegistry.defaultElements.register("TextBlock", (_) => new TextBlock());
  GlobalRegistry.defaultElements.register(
    "TextRun",
    (_) => new TextRun(),
    Versions.v1_2
  );
  GlobalRegistry.defaultElements.register("FactSet", (_) => new FactSet());
  GlobalRegistry.defaultElements.register("ImageSet", (_) => new ImageSet());
  GlobalRegistry.defaultElements.register("Image", (_) => new Image());

  GlobalRegistry.defaultActions.register(
    ShowCardAction.JsonTypeName,
    (_) => new ShowCardAction()
  );
}
