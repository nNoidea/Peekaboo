import { IFormatProfile } from '../interfaces';

export class Mp4Profile implements IFormatProfile {
  extension = 'mp4';

  getFFmpegArgs(fps: number, showMouse: boolean, audioOptions?: { recordSystemAudio: boolean; recordMic: boolean; }): string[] {
    const args = [
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-pix_fmt', 'yuv420p',
      '-crf', '23',
      '-threads', '0'
    ];

    if (audioOptions?.recordSystemAudio || audioOptions?.recordMic) {
      args.push('-c:a', 'aac', '-b:a', '128k', '-ac', '2');
    }

    return args;
  }
}
