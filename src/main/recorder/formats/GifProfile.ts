import { IFormatProfile } from '../interfaces';

export class GifProfile implements IFormatProfile {
  extension = 'gif';

  getFFmpegArgs(fps: number, showMouse: boolean, audioOptions?: { recordSystemAudio: boolean; recordMic: boolean; }): string[] {
    // For GIF, we first record as MP4 (no audio), then convert to GIF on stop
    // This is a two-step process that's more reliable than single-pass GIF encoding
    return [
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-pix_fmt', 'yuv420p',
      '-crf', '23'
    ];
  }
}
