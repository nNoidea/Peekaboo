export {};

declare global {
  interface Window {
    electronAPI: {
      closeApp: () => void;
      startRecording: (options: { format: string; outputPath: string; fps: number; showMouse: boolean; audioOptions?: { recordSystemAudio: boolean; recordMic: boolean; } }) => Promise<void>;
      stopRecording: () => Promise<void>;
      selectSavePath: (format: string) => Promise<string | null>;
      setIgnoreMouseEvents: (ignore: boolean, options?: any) => void;
      minimizeApp: () => void;
      maximizeApp: () => void;
      onRecordingStopped: (callback: () => void) => void;
      getSettings: () => Promise<{ format: string; fps: number; showMouse: boolean; audioOptions?: { recordSystemAudio: boolean; recordMic: boolean; } }>;
      saveSettings: (settings: { format?: string; fps?: number; showMouse?: boolean; audioOptions?: { recordSystemAudio: boolean; recordMic: boolean; } }) => Promise<void>;
    };
  }
}
