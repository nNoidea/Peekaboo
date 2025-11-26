import { spawn, ChildProcess } from 'child_process';
import { Rectangle } from 'electron';
import { IRecorderBackend, IFormatProfile } from './interfaces';
import { LinuxX11Backend } from './backends/LinuxX11Backend';
import { Mp4Profile } from './formats/Mp4Profile';
import { GifProfile } from './formats/GifProfile';
import * as fs from 'fs';
import * as path from 'path';

export class RecorderEngine {
  private process: ChildProcess | null = null;
  private backend: IRecorderBackend;
  private profiles: { [key: string]: IFormatProfile } = {};
  private currentFormat: string = '';
  private currentOutputPath: string = '';
  private tempMp4Path: string = '';

  constructor() {
    // Detect OS and choose backend. For now hardcoded to LinuxX11 as per plan.
    this.backend = new LinuxX11Backend();
    
    // Register profiles
    this.profiles['MP4'] = new Mp4Profile();
    this.profiles['GIF'] = new GifProfile();
  }

  startRecording(bounds: Rectangle, format: string, outputPath: string, fps: number, showMouse: boolean, audioOptions?: { recordSystemAudio: boolean; recordMic: boolean; }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.process) {
        reject(new Error('Recording already in progress'));
        return;
      }

      const profile = this.profiles[format];
      if (!profile) {
        reject(new Error(`Format ${format} not supported`));
        return;
      }

      // Store format and output path for later use
      this.currentFormat = format;
      this.currentOutputPath = outputPath;

      // For GIF, record to a temp MP4 file first
      let actualOutputPath = outputPath;
      if (format === 'GIF') {
        this.tempMp4Path = outputPath.replace(/\.gif$/i, '.tmp.mp4');
        actualOutputPath = this.tempMp4Path;
      }

      const { command, args } = this.backend.getRecordingCommand(bounds, actualOutputPath, profile, fps, showMouse, audioOptions);
      
      console.log('Spawning ffmpeg:', command, args.join(' '));

      this.process = spawn(command, args);

      this.process.stdout?.on('data', (data) => {
        console.log(`ffmpeg stdout: ${data}`);
      });

      this.process.stderr?.on('data', (data) => {
        console.error(`ffmpeg stderr: ${data}`);
      });

      this.process.on('close', (code) => {
        console.log(`ffmpeg process exited with code ${code}`);
      });

      this.process.on('error', (err) => {
        console.error('ffmpeg spawn error:', err);
        this.process = null;
        reject(err);
      });

      // Assume started successfully if no error immediately
      resolve();
    });
  }

  stopRecording(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }

      // Graceful stop for ffmpeg usually involves sending 'q' to stdin or SIGINT
      // SIGINT is safer for file finalization
      this.process.kill('SIGINT');
      
      // Wait for exit
      const onExit = () => {
        this.process = null;
        console.log('Recording stopped.');
        
        // If GIF, convert the temp MP4 to GIF
        if (this.currentFormat === 'GIF' && this.tempMp4Path) {
          console.log('Converting MP4 to GIF...');
          this.convertMp4ToGif(this.tempMp4Path, this.currentOutputPath)
            .then(() => {
              console.log('GIF conversion complete.');
              resolve();
            })
            .catch((err) => {
              console.error('GIF conversion failed:', err);
              resolve(); // Resolve anyway to not block UI
            });
        } else {
          resolve();
        }
      };

      if (this.process) {
        this.process.once('exit', onExit);
        // Fallback kill if it doesn't exit in 5 minutes (GIF encoding can take time)
        setTimeout(() => {
            if (this.process) {
                console.log('Force killing ffmpeg (timeout)...');
                this.process.kill('SIGKILL');
                onExit();
            }
        }, 300000);
      } else {
        onExit();
      }
    });
  }

  private convertMp4ToGif(mp4Path: string, gifPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use system ffmpeg for conversion
      let ffmpegPath = '';
      try {
        const systemFfmpeg = require('child_process').execSync('which ffmpeg').toString().trim();
        if (systemFfmpeg) {
          ffmpegPath = systemFfmpeg;
        }
      } catch (e) {
        // Fallback
        ffmpegPath = 'ffmpeg';
      }

      const args = [
        '-i', mp4Path,
        '-vf', 'fps=30,scale=-1:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse',
        '-y', gifPath
      ];

      console.log('Converting:', ffmpegPath, args.join(' '));

      const conversionProcess = spawn(ffmpegPath, args);

      conversionProcess.stderr?.on('data', (data) => {
        console.log(`GIF conversion: ${data}`);
      });

      conversionProcess.on('close', (code) => {
        console.log(`GIF conversion exited with code ${code}`);
        
        // Delete temp MP4 file
        if (fs.existsSync(mp4Path)) {
          try {
            fs.unlinkSync(mp4Path);
            console.log('Deleted temp MP4 file:', mp4Path);
          } catch (err) {
            console.error('Failed to delete temp MP4:', err);
          }
        }

        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`GIF conversion failed with code ${code}`));
        }
      });

      conversionProcess.on('error', (err) => {
        console.error('GIF conversion error:', err);
        reject(err);
      });
    });
  }

  isRecording(): boolean {
    return !!this.process;
  }
}
