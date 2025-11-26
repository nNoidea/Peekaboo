import { Rectangle } from 'electron';
import { IRecorderBackend, IFormatProfile } from '../interfaces';
import ffmpegPath from 'ffmpeg-static';

export class LinuxX11Backend implements IRecorderBackend {
  getRecordingCommand(bounds: Rectangle, output: string, profile: IFormatProfile, fps: number, showMouse: boolean, audioOptions?: { recordSystemAudio: boolean; recordMic: boolean; }): { command: string, args: string[] } {
    const display = process.env.DISPLAY || ':0.0';
    // Ensure bounds are even numbers (ffmpeg requirement often)
    const width = bounds.width % 2 === 0 ? bounds.width : bounds.width - 1;
    const height = bounds.height % 2 === 0 ? bounds.height : bounds.height - 1;
    const x = bounds.x;
    const y = bounds.y;

    const args = [
      '-f', 'x11grab',
      '-video_size', `${width}x${height}`,
      '-framerate', `${fps}`,
      '-draw_mouse', showMouse ? '1' : '0',
      '-i', `${display}+${x},${y}`
    ];

    // Audio Logic
    if (audioOptions?.recordSystemAudio || audioOptions?.recordMic) {
      try {
        // 1. System Audio
        if (audioOptions.recordSystemAudio) {
          // Find default sink monitor
          const pactlInfo = require('child_process').execSync('pactl info').toString();
          const defaultSinkMatch = pactlInfo.match(/Default Sink: (.+)/);
          if (defaultSinkMatch) {
            const defaultSink = defaultSinkMatch[1];
            args.push('-f', 'pulse', '-i', `${defaultSink}.monitor`);
          }
        }

        // 2. Microphone
        if (audioOptions.recordMic) {
          args.push('-f', 'pulse', '-i', 'default');
        }

        // 3. Mixing if both
        if (audioOptions.recordSystemAudio && audioOptions.recordMic) {
          args.push('-filter_complex', '[1:a][2:a]amerge=inputs=2[a]', '-map', '0:v', '-map', '[a]');
        } else if (audioOptions.recordSystemAudio) {
           // Video is 0, System Audio is 1
           args.push('-map', '0:v', '-map', '1:a');
        } else if (audioOptions.recordMic) {
           // Video is 0, Mic is 1
           args.push('-map', '0:v', '-map', '1:a');
        }

      } catch (e) {
        console.error('Failed to setup audio:', e);
      }
    }

    args.push(...profile.getFFmpegArgs(fps, showMouse, audioOptions));
    args.push('-y', output);

    let binaryPath = '';
    
    // Try to find system ffmpeg first, especially if audio is needed
    try {
      const systemFfmpeg = require('child_process').execSync('which ffmpeg').toString().trim();
      if (systemFfmpeg) {
        binaryPath = systemFfmpeg;
      }
    } catch (e) {
      // System ffmpeg not found
    }

    if (!binaryPath) {
      binaryPath = ffmpegPath || 'ffmpeg';
      // Fix for Electron asar packaging
      if (binaryPath.includes('app.asar')) {
        binaryPath = binaryPath.replace('app.asar', 'app.asar.unpacked');
      }
    }
    
    console.log('LinuxX11Backend: Using ffmpeg path:', binaryPath);

    return { command: binaryPath, args };
  }

  async stopRecording(): Promise<void> {
    // This backend relies on the engine to kill the process.
    // We could implement specific cleanup here if needed.
    return Promise.resolve();
  }
}
