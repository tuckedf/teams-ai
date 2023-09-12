import * as React from "react";
import type { IResourceInformation, RenderArgs } from "../core";
import {
  CardElement,
  createProps,
  isMobileOS,
  SerializableObject,
  SerializableObjectCollectionProperty,
  StringProperty,
  Strings,
  Versions,
} from "../core";

export abstract class ContentSource extends SerializableObject {
  // #region Schema

  static readonly mimeTypeProperty = new StringProperty(
    Versions.v1_1,
    "mimeType"
  );
  static readonly urlProperty = new StringProperty(Versions.v1_1, "url");

  get mimeType(): string | undefined {
    return this.getValue(ContentSource.mimeTypeProperty);
  }

  set mimeType(value: string | undefined) {
    this.setValue(ContentSource.mimeTypeProperty, value);
  }

  get url(): string | undefined {
    return this.getValue(ContentSource.urlProperty);
  }

  set url(value: string | undefined) {
    this.setValue(ContentSource.urlProperty, value);
  }

  // #endregion

  constructor(url?: string, mimeType?: string) {
    super();

    this.url = url;
    this.mimeType = mimeType;
  }

  isValid(): boolean {
    return this.mimeType && this.url ? true : false;
  }
}

export class CaptionSource extends ContentSource {
  // #region Schema

  static readonly labelProperty = new StringProperty(Versions.v1_6, "label");

  get label(): string | undefined {
    return this.getValue(CaptionSource.labelProperty);
  }

  set label(value: string | undefined) {
    this.setValue(CaptionSource.labelProperty, value);
  }

  // #endregion

  constructor(url?: string, mimeType?: string, label?: string) {
    super(url, mimeType);

    this.label = label;
  }

  protected getSchemaKey(): string {
    return "CaptionSource";
  }

  render(_args?: RenderArgs): JSX.Element | null {
    return this.isValid() ? (
      <track src={this.url} kind="captions" label={this.label}></track>
    ) : null;
  }
}

export class MediaSource extends ContentSource {
  protected getSchemaKey(): string {
    return "MediaSource";
  }

  render(): JSX.Element | null {
    return this.isValid() ? (
      <source src={this.url} type={this.mimeType}></source>
    ) : null;
  }
}

export abstract class MediaPlayer {
  private _posterUrl?: string;

  abstract canPlay(): boolean;
  abstract render(): JSX.Element;
  abstract fetchVideoDetails(): Promise<void>;

  play() {
    // Do nothing in base implementation
  }

  get posterUrl(): string | undefined {
    return this._posterUrl;
  }

  protected set posterUrl(value: string | undefined) {
    this._posterUrl = value;
  }

  get selectedMediaType(): string | undefined {
    return undefined;
  }
}

export class HTML5MediaPlayer extends MediaPlayer {
  private _selectedMediaType?: string;
  private _selectedSources: MediaSource[] = [];
  private _captionSources: CaptionSource[] = [];
  private _mediaElement?: HTMLMediaElement;

  private processSources() {
    this._selectedSources = [];
    this._captionSources = [];
    this._selectedMediaType = undefined;

    for (const source of this.owner.sources) {
      const mimeComponents = source.mimeType ? source.mimeType.split("/") : [];

      if (mimeComponents.length === 2) {
        if (!this._selectedMediaType) {
          const index = HTML5MediaPlayer.supportedMediaTypes.indexOf(
            mimeComponents[0]
          );

          if (index >= 0) {
            this._selectedMediaType =
              HTML5MediaPlayer.supportedMediaTypes[index];
          }
        }
        if (mimeComponents[0] === this._selectedMediaType) {
          this._selectedSources.push(source);
        }
      }
    }

    this._captionSources.push(...this.owner.captionSources);
  }

  static readonly supportedMediaTypes = ["audio", "video"];

  constructor(readonly owner: Media) {
    super();

    this.processSources();
  }

  canPlay(): boolean {
    return this._selectedSources.length > 0;
  }

  async fetchVideoDetails() {
    // Nothing to fetch for the HTML5 media player
  }

  render(): JSX.Element {
    if (this._selectedMediaType === "video") {
      this._mediaElement = document.createElement("video");
    } else {
      this._mediaElement = document.createElement("audio");
    }

    const props = createProps();
    props["aria-label"] = this.owner.altText
      ? this.owner.altText
      : Strings.defaults.mediaPlayerAriaLabel();
    props.playsInline = true;
    // We enable crossorigin for cases where the caption file has a different domain than
    // the video file. If the caption file lives in a different domain than the video file
    // and crossorigin is not set, then the caption file will fail to load.
    props.crossOrigin = "";
    props.autoPlay = true;
    props.controls = true;
    props.preload = "none";
    props.style.width = "100%";

    if (isMobileOS()) {
      props.muted = true;
    }

    const renderedSources = this.owner.sources
      .map((source) => source.render())
      .filter((value) => value !== undefined);

    const renderedCaptionSources = this.owner.captionSources
      .filter((source) => source.mimeType === "vtt")
      .map((source) => source.render())
      .filter((value) => value !== undefined);

    return React.createElement(
      this._selectedMediaType === "video" ? "video" : "audio",
      props,
      renderedSources,
      renderedCaptionSources
    );
  }

  play() {
    if (this._mediaElement) {
      this._mediaElement.play();
    }
  }

  get selectedMediaType(): string | undefined {
    return this._selectedMediaType;
  }
}

export abstract class CustomMediaPlayer extends MediaPlayer {
  constructor(_matches: RegExpExecArray) {
    super();
  }
}

export abstract class IFrameMediaMediaPlayer extends CustomMediaPlayer {
  private _videoId?: string;

  constructor(matches: RegExpExecArray, readonly iFrameTitle?: string) {
    super(matches);

    if (matches.length >= 2) {
      this._videoId = matches[1];
    }
  }

  abstract getEmbedVideoUrl(): string;

  canPlay(): boolean {
    return this._videoId !== undefined;
  }

  render(): JSX.Element {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "0",
          paddingBottom: "56.25%",
        }}
      >
        <iframe
          sandbox=""
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
          }}
          src={this.getEmbedVideoUrl()}
          frameBorder="0"
          title={this.iFrameTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={true}
        ></iframe>
      </div>
    );
  }

  get videoId(): string | undefined {
    return this._videoId;
  }
}

export class VimeoPlayer extends IFrameMediaMediaPlayer {
  async fetchVideoDetails(): Promise<void> {
    const oEmbedUrl = `https://vimeo.com/api/oembed.json?url=${this.getEmbedVideoUrl()}`;
    const response = await fetch(oEmbedUrl);

    if (response.ok) {
      const json = await response.json();

      this.posterUrl = json["thumbnail_url"];
    }
  }

  getEmbedVideoUrl(): string {
    return `https://player.vimeo.com/video/${this.videoId}?autoplay=1`;
  }
}

export class DailymotionPlayer extends IFrameMediaMediaPlayer {
  async fetchVideoDetails(): Promise<void> {
    const apiUrl = `https://api.dailymotion.com/video/${this.videoId}?fields=thumbnail_720_url`;
    const response = await fetch(apiUrl);

    if (response.ok) {
      const json = await response.json();

      this.posterUrl = json["thumbnail_720_url"];
    }
  }

  getEmbedVideoUrl(): string {
    return `https://www.dailymotion.com/embed/video/${this.videoId}?autoplay=1`;
  }
}

export class YouTubePlayer extends IFrameMediaMediaPlayer {
  private _startTimeIndex?: number;

  constructor(matches: RegExpExecArray, readonly iFrameTitle?: string) {
    super(matches, iFrameTitle);

    if (matches.length >= 3 && matches[2] !== undefined) {
      this._startTimeIndex = parseInt(matches[2], 10);
    }
  }

  /* eslint-disable-next-line @typescript-eslint/require-await */
  async fetchVideoDetails(): Promise<void> {
    this.posterUrl = this.videoId
      ? `https://img.youtube.com/vi/${this.videoId}/maxresdefault.jpg`
      : undefined;
  }

  getEmbedVideoUrl(): string {
    let url = `https://www.youtube.com/embed/${this.videoId}?autoplay=1`;

    if (this._startTimeIndex !== undefined) {
      url += `&start=${this._startTimeIndex}`;
    }

    return url;
  }
}

export interface ICustomMediaPlayer {
  urlPatterns: RegExp[];
  createMediaPlayer: (matches: RegExpExecArray) => CustomMediaPlayer;
}

enum MediaPlayerStatus {
  Loading,
  ShowPoster,
  ShowPlayer,
}

export abstract class MediaBase extends CardElement {
  // #region Schema

  static readonly sourcesProperty = new SerializableObjectCollectionProperty(
    Versions.v1_1,
    "sources",
    (_) => new MediaSource()
  );
  static readonly captionSourcesProperty =
    new SerializableObjectCollectionProperty(
      Versions.v1_6,
      "captionSources",
      (_) => new CaptionSource()
    );
  static readonly posterProperty = new StringProperty(Versions.v1_1, "poster");
  static readonly altTextProperty = new StringProperty(
    Versions.v1_1,
    "altText"
  );

  get sources(): MediaSource[] {
    return this.getValue(MediaBase.sourcesProperty);
  }

  set sources(value: MediaSource[]) {
    this.setValue(MediaBase.sourcesProperty, value);
  }

  get captionSources(): CaptionSource[] {
    return this.getValue(MediaBase.captionSourcesProperty);
  }

  set captionSources(value: CaptionSource[]) {
    this.setValue(MediaBase.captionSourcesProperty, value);
  }

  get poster(): string | undefined {
    return this.getValue(MediaBase.posterProperty);
  }

  set poster(value: string | undefined) {
    this.setValue(MediaBase.posterProperty, value);
  }

  get altText(): string | undefined {
    return this.getValue(MediaBase.altTextProperty);
  }

  set altText(value: string | undefined) {
    this.setValue(MediaBase.altTextProperty, value);
  }

  // #endregion

  getJsonTypeName(): string {
    return "Media";
  }
}

export class Media extends MediaBase {
  static customMediaPlayers: ICustomMediaPlayer[] = [
    {
      urlPatterns: [
        /^(?:https:\/\/)?(?:www\.)?youtube\.com\/watch\?(?=.*v=([\w\d-_]+))(?=(?:.*t=(\d+))?).*/gi,
        /^(?:https:\/\/)?youtu\.be\/([\w\d-_]+)(?:\?t=(\d+))?/gi,
      ],
      createMediaPlayer: (matches) =>
        new YouTubePlayer(matches, Strings.defaults.youTubeVideoPlayer()),
    },
    {
      urlPatterns: [/^(?:https:\/\/)?vimeo\.com\/([\w\d-_]+).*/gi],
      createMediaPlayer: (matches) =>
        new VimeoPlayer(matches, Strings.defaults.vimeoVideoPlayer()),
    },
    {
      urlPatterns: [
        /^(?:https:\/\/)?(?:www\.)?dailymotion\.com\/video\/([\w\d-_]+).*/gi,
      ],
      createMediaPlayer: (matches) =>
        new DailymotionPlayer(
          matches,
          Strings.defaults.dailymotionVideoPlayer()
        ),
    },
  ];

  private _mediaPlayer!: MediaPlayer;

  private createMediaPlayer() {
    const createMediaPlayerFromRegistry = (): MediaPlayer | undefined => {
      for (const provider of Media.customMediaPlayers) {
        for (const source of this.sources) {
          if (source.url) {
            for (const pattern of provider.urlPatterns) {
              const matches = pattern.exec(source.url);

              if (matches !== null) {
                return provider.createMediaPlayer(matches);
              }
            }
          }
        }
      }

      return undefined;
    };

    if (!this._mediaPlayer) {
      this._mediaPlayer =
        createMediaPlayerFromRegistry() ?? new HTML5MediaPlayer(this);

      this._mediaPlayer.fetchVideoDetails().then(() => {
        this._status = MediaPlayerStatus.ShowPoster;

        this.updateLayout();
      });
    }
  }

  private startPlayback() {
    if (this.hostConfig.media.allowInlinePlayback) {
      this._status = MediaPlayerStatus.ShowPlayer;

      this.updateLayout();
    } else {
      if (Media.onPlay) {
        Media.onPlay(this);
      }
    }
  }

  private renderPlayButton(): JSX.Element {
    const clickHandler = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      this.startPlayback();
    };

    const keyDownHandler = (e: React.KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();

        this.startPlayback();
      }
    };

    return (
      <div
        className={this.hostConfig.makeCssClassName(
          "ac-media-playButton-container"
        )}
      >
        <div
          className={this.hostConfig.makeCssClassName("ac-media-playButton")}
          tabIndex={0}
          role="button"
          aria-label={Strings.defaults.mediaPlayerPlayMedia()}
          onClick={clickHandler}
          onKeyDown={keyDownHandler}
        >
          <div
            className={this.hostConfig.makeCssClassName(
              "ac-media-playButton-arrow"
            )}
          ></div>
        </div>
      </div>
    );
  }

  private renderPoster(): JSX.Element {
    let posterUrl = this.poster ? this.poster : this._mediaPlayer.posterUrl;

    if (!posterUrl) {
      posterUrl = this.hostConfig.media.defaultPoster;
    }

    const classNames: string[] = ["ac-media-poster"];

    if (!posterUrl) {
      classNames.push("empty");
    }

    return (
      <div
        className={this.hostConfig.makeCssClassName(...classNames)}
        role="contentinfo"
        aria-label={this.altText ?? Strings.defaults.mediaPlayerAriaLabel()}
      >
        {posterUrl ? (
          <img
            className={this.hostConfig.makeCssClassName(
              "ac-media-poster-image"
            )}
            src={posterUrl}
            alt=""
          ></img>
        ) : undefined}
        {this.hostConfig.supportsInteractivity && this._mediaPlayer.canPlay()
          ? this.renderPlayButton()
          : undefined}
      </div>
    );
  }

  private _status: MediaPlayerStatus = MediaPlayerStatus.Loading;

  protected internalRender(_args?: RenderArgs): JSX.Element | null {
    switch (this._status) {
      case MediaPlayerStatus.Loading:
        return (
          <div className={this.hostConfig.makeCssClassName("ac-media")}></div>
        );
      case MediaPlayerStatus.ShowPoster:
        return this.renderPoster();
      case MediaPlayerStatus.ShowPlayer:
        return this._mediaPlayer.render();
    }
  }

  protected render(args?: RenderArgs): JSX.Element {
    this.createMediaPlayer();

    return super.render(args);
  }

  static onPlay?: (sender: Media) => void;

  releaseDOMResources() {
    super.releaseDOMResources();

    this._status = MediaPlayerStatus.ShowPoster;

    this.updateLayout();
  }

  getResourceInformation(): IResourceInformation[] {
    const result: IResourceInformation[] = [];

    if (this._mediaPlayer) {
      const posterUrl = this.poster
        ? this.poster
        : this.hostConfig.media.defaultPoster;

      if (posterUrl) {
        result.push({ url: posterUrl, mimeType: "image" });
      }
    }

    for (const mediaSource of this.sources) {
      if (mediaSource.isValid()) {
        result.push({
          url: mediaSource.url!,
          mimeType: mediaSource.mimeType!,
        });
      }
    }

    for (const captionSource of this.captionSources) {
      if (captionSource.isValid()) {
        result.push({
          url: captionSource.url!,
          mimeType: captionSource.mimeType!,
        });
      }
    }

    return result;
  }

  get selectedMediaType(): string | undefined {
    return this._mediaPlayer.selectedMediaType;
  }
}
