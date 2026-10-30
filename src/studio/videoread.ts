/** Reads a video file in the browser: a labeled contact sheet of frames and a small speech-ready WAV.
 *  The full video never leaves the device. */

export interface VideoRead {
  sheet: string; // base64 JPEG (no data: prefix)
  sheetUrl: string; // data URL for preview
  frames: number;
  stamps: string;
  duration: number;
  audio: string; // base64 WAV (16 kHz mono), "" when there is no readable sound
  audioNote: string;
}

const AUDIO_MAX_SEC = 180;
const AUDIO_MAX_FILE = 400 * 1024 * 1024;

function waitFor(el: HTMLMediaElement, event: string, ms = 8000) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => {
      el.removeEventListener(event, ok);
      reject(new Error("timeout"));
    }, ms);
    const ok = () => {
      clearTimeout(t);
      el.removeEventListener(event, ok);
      resolve();
    };
    el.addEventListener(event, ok);
  });
}

export function frameTimes(duration: number): number[] {
  const n = duration <= 15 ? 6 : duration <= 60 ? 9 : 12;
  const end = Math.max(0.2, duration - 0.15);
  const out: number[] = [Math.min(0.1, end)];
  for (let i = 1; i < n; i++) out.push(Math.round(((end * i) / (n - 1)) * 10) / 10);
  return Array.from(new Set(out.map((t) => Math.round(t * 10) / 10)));
}

async function readFrames(file: File, onStep: (s: string) => void) {
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true;
  v.playsInline = true;
  v.preload = "auto";
  v.src = url;
  try {
    await waitFor(v, "loadedmetadata", 15000);
    const duration = Number.isFinite(v.duration) ? v.duration : 0;
    if (!duration || !v.videoWidth) throw new Error("This video could not be opened here. Try an MP4 or MOV file.");
    const times = frameTimes(duration);
    const cols = times.length > 9 ? 4 : 3;
    const rows = Math.ceil(times.length / cols);
    const cw = 300;
    const ch = Math.round(Math.min(560, Math.max(170, (cw * v.videoHeight) / v.videoWidth)));
    const canvas = document.createElement("canvas");
    canvas.width = cols * cw;
    canvas.height = rows * ch;
    const g = canvas.getContext("2d");
    if (!g) throw new Error("Your browser could not draw the frames.");
    g.fillStyle = "#000";
    g.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < times.length; i++) {
      onStep(`Pulling frame ${i + 1} of ${times.length}`);
      v.currentTime = Math.min(times[i], Math.max(0, duration - 0.05));
      try {
        await waitFor(v, "seeked", 8000);
      } catch {
        /* keep the last decoded frame */
      }
      const x = (i % cols) * cw;
      const y = Math.floor(i / cols) * ch;
      g.drawImage(v, x, y, cw, ch);
      const label = times[i].toFixed(1) + "s";
      g.font = "bold 22px system-ui, sans-serif";
      const w = g.measureText(label).width + 14;
      g.fillStyle = "rgba(0,0,0,0.72)";
      g.fillRect(x + 6, y + 6, w, 30);
      g.fillStyle = "#fff";
      g.fillText(label, x + 13, y + 29);
    }
    const sheetUrl = canvas.toDataURL("image/jpeg", 0.72);
    return { sheetUrl, sheet: sheetUrl.split(",")[1] || "", frames: times.length, stamps: times.map((t) => t.toFixed(1) + "s").join(", "), duration: Math.round(duration * 10) / 10 };
  } finally {
    v.removeAttribute("src");
    v.load();
    URL.revokeObjectURL(url);
  }
}

function toWav(samples: Float32Array, rate: number): ArrayBuffer {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const d = new DataView(buf);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) d.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  d.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  d.setUint32(16, 16, true);
  d.setUint16(20, 1, true);
  d.setUint16(22, 1, true);
  d.setUint32(24, rate, true);
  d.setUint32(28, rate * 2, true);
  d.setUint16(32, 2, true);
  d.setUint16(34, 16, true);
  str(36, "data");
  d.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    d.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

function b64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function readAudio(file: File): Promise<{ audio: string; note: string }> {
  if (file.size > AUDIO_MAX_FILE) return { audio: "", note: "The file is too big to pull the sound in the browser, so type what you say in the summary." };
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC || typeof OfflineAudioContext === "undefined") return { audio: "", note: "This browser can't read the sound, so type what you say in the summary." };
  const ctx = new AC();
  try {
    const data = await file.arrayBuffer();
    const decoded: AudioBuffer = await new Promise((resolve, reject) => {
      const p = ctx.decodeAudioData(data, resolve, reject);
      if (p && typeof p.then === "function") p.then(resolve, reject);
    });
    const secs = Math.min(decoded.duration, AUDIO_MAX_SEC);
    const rate = 16000;
    const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(secs * rate)), rate);
    const src = off.createBufferSource();
    src.buffer = decoded;
    src.connect(off.destination);
    src.start(0);
    const out = await off.startRendering();
    const ch = out.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < ch.length; i += 64) peak = Math.max(peak, Math.abs(ch[i]));
    if (peak < 0.003) return { audio: "", note: "No sound found in this video." };
    const note = decoded.duration > AUDIO_MAX_SEC ? "Only the first 3 minutes of sound are transcribed." : "";
    return { audio: b64(toWav(ch, rate)), note };
  } catch {
    return { audio: "", note: "The sound in this file couldn't be read here, so type what you say in the summary." };
  } finally {
    void ctx.close().catch(() => {});
  }
}

export async function readVideo(file: File, onStep: (s: string) => void): Promise<VideoRead> {
  onStep("Opening the video");
  const f = await readFrames(file, onStep);
  onStep("Pulling the sound");
  const a = await readAudio(file);
  return { ...f, audio: a.audio, audioNote: a.note };
}
