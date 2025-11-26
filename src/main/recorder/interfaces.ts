import { Rectangle } from 'electron';

export interface AudioOptions {
  recordSystemAudio: boolean;
  recordMic: boolean;
}

export interface IFormatProfile {
  extension: string;
  getFFmpegArgs(fps: number, showMouse: boolean, audioOptions?: AudioOptions): string[];
}

export interface IRecorderBackend {
  getRecordingCommand(bounds: Rectangle, output: string, profile: IFormatProfile, fps: number, showMouse: boolean, audioOptions?: AudioOptions): { command: string, args: string[] };
  stopRecording(): Promise<void>;
}
