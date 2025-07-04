declare module "react-google-recaptcha" {
  import { Component } from "react";

  export interface ReCAPTCHAProps {
    sitekey: string;
    onChange?: (token: string | null) => void;
    onExpired?: () => void;
    onErrored?: () => void;
    theme?: "light" | "dark";
    type?: "image" | "audio";
    tabindex?: number;
    onLoad?: () => void;
    size?: "compact" | "normal" | "invisible";
    badge?: "bottomright" | "bottomleft" | "inline";
    hl?: string;
    isolated?: boolean;
    nonce?: string;
    enterprise?: boolean;
    reCaptchaCompat?: boolean;
  }

  export interface ReCAPTCHAInstance {
    execute(): void;
    executeAsync(): Promise<string>;
    reset(): void;
    getResponse(): string;
  }

  export default class ReCAPTCHA extends Component<ReCAPTCHAProps> {
    execute(): void;
    executeAsync(): Promise<string>;
    reset(): void;
    getResponse(): string;
  }
}
