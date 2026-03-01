import { execFile } from "child_process";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";

const WHISPER_PATH = process.env.WHISPER_PATH || "whisper-cpp";
const WHISPER_MODEL = process.env.WHISPER_MODEL || "small";

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  // Write audio to temp file
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `whisper-${Date.now()}.wav`);

  try {
    await writeFile(tmpFile, audioBuffer);

    const text = await new Promise<string>((resolve, reject) => {
      // Try whisper-cpp CLI
      execFile(
        WHISPER_PATH,
        [
          "-m",
          path.join(
            process.env.WHISPER_MODELS_PATH || "/usr/local/share/whisper-cpp/models",
            `ggml-${WHISPER_MODEL}.bin`
          ),
          "-f",
          tmpFile,
          "--no-timestamps",
          "-nt",
        ],
        { timeout: 30000 },
        (error, stdout, stderr) => {
          if (error) {
            console.error("Whisper error:", stderr);
            reject(error);
            return;
          }
          resolve(stdout.trim());
        }
      );
    });

    return text;
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}

export async function isWhisperAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile(WHISPER_PATH, ["--help"], { timeout: 3000 }, (error) => {
      resolve(!error);
    });
  });
}
