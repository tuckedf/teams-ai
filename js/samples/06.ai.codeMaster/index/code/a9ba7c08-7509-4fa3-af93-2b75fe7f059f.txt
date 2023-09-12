/* eslint-disable arrow-body-style */
import * as React from "react";
import type { IImage } from "./shared";

export type ImageRenderer = (
  image: IImage,
  props: React.ImgHTMLAttributes<HTMLImageElement>
) => JSX.Element | null;

export const defaultImageRenderer: ImageRenderer = (
  _image: IImage,
  props: React.ImgHTMLAttributes<HTMLImageElement>
): JSX.Element | null => {
  /* eslint-disable-next-line jsx-a11y/alt-text */
  return <img {...props} />;
};
