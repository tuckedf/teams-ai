import * as React from "react";
import type { CardElement, RenderArgs, SerializableObject } from "../core";
import {
  EnumProperty,
  ImageSize,
  SerializableObjectCollectionProperty,
  Size,
  Versions,
} from "../core";
import { CardElementContainer } from "./card-element-container";
import { Image } from "./image";

export class ImageSet extends CardElementContainer {
  // #region Schema

  static readonly imagesProperty = new SerializableObjectCollectionProperty(
    Versions.v1_0,
    "images",
    (_) => new Image(),
    (sender: SerializableObject, item: SerializableObject) => {
      (item as Image).setParent(sender as CardElement);
    }
  );
  static readonly imageSizeProperty = new EnumProperty(
    Versions.v1_0,
    "imageSize",
    ImageSize,
    ImageSize.Medium
  );

  private get _images(): Image[] {
    return this.getValue(ImageSet.imagesProperty);
  }

  private set _images(value: Image[]) {
    this.setValue(ImageSet.imagesProperty, value);
  }

  get imageSize(): ImageSize {
    return this.getValue(ImageSet.imageSizeProperty);
  }

  set imageSize(value: ImageSize) {
    this.setValue(ImageSet.imageSizeProperty, value);
  }

  // #endregion

  protected internalRender(_args?: RenderArgs): JSX.Element | null {
    if (this._images.length > 0) {
      const renderedImages: JSX.Element[] = [];

      for (const image of this._images) {
        switch (this.imageSize) {
          case ImageSize.Small:
            image.size = Size.Small;
            break;
          case ImageSize.Large:
            image.size = Size.Large;
            break;
          default:
            image.size = Size.Medium;
            break;
        }

        image.maxHeight = this.hostConfig.imageSet.maxImageHeight;

        renderedImages.push(<image.Render key={image.key} />);
      }

      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {renderedImages}
        </div>
      );
    }

    return null;
  }

  getItemCount(): number {
    return this._images.length;
  }

  getItemAt(index: number): CardElement {
    return this._images[index];
  }

  getFirstVisibleRenderedItem(): CardElement | undefined {
    return this._images && this._images.length > 0
      ? this._images[0]
      : undefined;
  }

  getLastVisibleRenderedItem(): CardElement | undefined {
    return this._images && this._images.length > 0
      ? this._images[this._images.length - 1]
      : undefined;
  }

  removeItem(item: CardElement): boolean {
    if (item instanceof Image) {
      const itemIndex = this._images.indexOf(item);

      if (itemIndex >= 0) {
        this._images.splice(itemIndex, 1);

        item.setParent(undefined);

        this.updateLayout();

        return true;
      }
    }

    return false;
  }

  getJsonTypeName(): string {
    return "ImageSet";
  }

  addImage(image: Image) {
    if (!image.parent) {
      this._images.push(image);

      image.setParent(this);
    } else {
      throw new Error("This image already belongs to another ImageSet");
    }
  }

  indexOf(cardElement: CardElement): number {
    return cardElement instanceof Image
      ? this._images.indexOf(cardElement)
      : -1;
  }
}
