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
            "30", // Quality: 0-63, lower = better quality. 30 is good balance
            "-b:v",
            "0", // Required for CRF mode in VP9
            "-deadline",
            "realtime", // Fast encoding for real-time recording
            "-cpu-used",
            "5", // Speed: 0-8, higher = faster but lower quality. 5 is good for realtime
            "-row-mt",
            "1", // Enable row-based multithreading
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
