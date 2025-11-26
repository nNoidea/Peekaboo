import { IFormatProfile } from "../interfaces";

export class WebmProfile implements IFormatProfile {
    extension = "webm";

    getFFmpegArgs(fps: number, showMouse: boolean, audioOptions?: { recordSystemAudio: boolean; recordMic: boolean }): string[] {
        // VP9 codec for excellent compression with good quality
        // Using two-pass would be better but requires temp files, so we use CRF mode
        const args = [
            "-c:v",
            "libvpx-vp9",
            "-crf",
            "30",
            "-b:v",
            "0",
            "-deadline",
            "realtime",
            "-cpu-used",
            "8", // Max speed for real-time recording
            "-row-mt",
            "1",
            "-tile-columns",
            "2", // Parallel encoding
            "-frame-parallel",
            "1",
            "-threads",
            "0", // Auto-detect threads
            "-pix_fmt",
            "yuv420p",
        ];

        // Add Opus audio codec if audio is enabled (excellent compression)
        if (audioOptions?.recordSystemAudio || audioOptions?.recordMic) {
            args.push(
                "-c:a",
                "libopus",
                "-b:a",
                "96k", // 96kbps is good quality for voice/system audio
                "-ac",
                "2" // Stereo
            );
        }

        return args;
    }
}
