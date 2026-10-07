// Helper utilitas untuk Face Recognition di browser menggunakan @vladmandic/face-api
// Berjalan 100% di browser sisi klien (WASM/WebGL)

let modelsLoaded = false;
let loadPromise: Promise<boolean> | null = null;

export async function loadFaceApi() {
  if (typeof window === "undefined") return null;
  const faceapi = await import("@vladmandic/face-api");
  return faceapi;
}

export async function loadFaceModels(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (modelsLoaded) return true;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const faceapi = await loadFaceApi();
      if (!faceapi) return false;

      const MODEL_URL = "/models";
      
      // Muat model SSD MobileNet V1 (akurasi foto tinggi), TinyFace (video cepat), Landmarks, dan Recognition
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      modelsLoaded = true;
      return true;
    } catch (err) {
      console.error("Gagal memuat model Face API:", err);
      loadPromise = null;
      return false;
    }
  })();

  return loadPromise;
}

// Normalisasi ukuran elemen gambar/video/canvas ke canvas berdimensi ideal
export function prepareInputCanvas(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): HTMLCanvasElement {
  if (typeof document === "undefined") {
    throw new Error("prepareInputCanvas hanya dapat dijalankan di browser.");
  }
  
  let width = 0;
  let height = 0;
  
  if (input instanceof HTMLImageElement) {
    width = input.naturalWidth || input.width;
    height = input.naturalHeight || input.height;
  } else if (input instanceof HTMLVideoElement) {
    width = input.videoWidth || input.width;
    height = input.videoHeight || input.height;
  } else if (input instanceof HTMLCanvasElement) {
    width = input.width;
    height = input.height;
  }
  
  if (!width || !height) {
    width = 640;
    height = 480;
  }

  // Batasi ukuran maksimal ke 1024px agar hemat memori GPU dan akurasi deteksi maksimal
  const maxDim = 1024;
  let targetWidth = width;
  let targetHeight = height;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    targetWidth = Math.round(width * scale);
    targetHeight = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(input, 0, 0, targetWidth, targetHeight);
  }
  return canvas;
}

// Ekstrak 128-d deskriptor vektor dari elemen gambar atau canvas dengan multi-stage fallback
export async function extractFaceDescriptor(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<{ descriptor: number[]; detectionBox: any; canvas: HTMLCanvasElement } | null> {
  const faceapi = await loadFaceApi();
  if (!faceapi) return null;

  const isReady = await loadFaceModels();
  if (!isReady) return null;

  const canvas = prepareInputCanvas(input);

  let detection: any = null;

  // Tahap 1: Coba deteksi menggunakan SSD MobileNet V1 (Akurasi Tinggi untuk Foto Statis)
  try {
    detection = await faceapi
      .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
  } catch (e) {
    console.warn("SSD MobileNet pass 1 failed, trying fallback:", e);
  }

  // Tahap 2: Coba SSD MobileNet V1 dengan ambang batas lebih ramah (0.15) jika foto sedikit redup
  if (!detection) {
    try {
      detection = await faceapi
        .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.15 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
    } catch (e) {
      console.warn("SSD MobileNet pass 2 failed:", e);
    }
  }

  // Tahap 3: Coba TinyFaceDetector dengan inputSize 512
  if (!detection) {
    try {
      detection = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.2 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
    } catch (e) {
      console.warn("TinyFaceDetector 512 failed:", e);
    }
  }

  // Tahap 4: Coba TinyFaceDetector dengan inputSize 320
  if (!detection) {
    try {
      detection = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.15 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
    } catch (e) {
      console.warn("TinyFaceDetector 320 failed:", e);
    }
  }

  // Tahap 5: Deteksi multi-face jika ada background, ambil wajah utama terbesar
  if (!detection) {
    try {
      const allFaces = await faceapi
        .detectAllFaces(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.15 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (allFaces && allFaces.length > 0) {
        allFaces.sort(
          (a: any, b: any) =>
            b.detection.box.width * b.detection.box.height -
            a.detection.box.width * a.detection.box.height
        );
        const primary = allFaces[0];
        return {
          descriptor: Array.from(primary.descriptor),
          detectionBox: primary.detection.box,
          canvas,
        };
      }
    } catch (e) {
      console.warn("AllFaces fallback failed:", e);
    }
  }

  if (!detection) return null;

  return {
    descriptor: Array.from(detection.descriptor),
    detectionBox: detection.detection.box,
    canvas,
  };
}

// Menghitung kemiripan antara dua vektor wajah (128 angka)
// Euclidean distance: semakin kecil semakin mirip (< 0.45 sangat mirip)
export function calculateFaceSimilarity(
  descriptor1: number[] | Float32Array,
  descriptor2: number[] | Float32Array
): { distance: number; similarityPercent: number; isMatch: boolean } {
  const d1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1);
  const d2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2);

  let sum = 0;
  for (let i = 0; i < d1.length; i++) {
    const diff = d1[i] - d2[i];
    sum += diff * diff;
  }
  const distance = Math.sqrt(sum);

  // Threshold standar FaceNet: < 0.48 dianggap orang yang sama
  const MATCH_THRESHOLD = 0.48;
  const isMatch = distance <= MATCH_THRESHOLD;

  // Hitung persentase kecocokan (0 - 100%)
  const similarityPercent = Math.max(0, Math.min(100, Math.round((1 - distance / 0.8) * 100)));

  return { distance, similarityPercent, isMatch };
}

// Potong dan kompres thumbnail wajah (JPEG 200x200) untuk penyimpanan ringan di DB (~15-20KB)
export function createFaceThumbnail(
  source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  box?: { x: number; y: number; width: number; height: number }
): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  const size = 200;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  if (box && box.width > 0 && box.height > 0) {
    const marginX = box.width * 0.25;
    const marginY = box.height * 0.25;
    const sx = Math.max(0, box.x - marginX);
    const sy = Math.max(0, box.y - marginY);
    const sw = box.width + marginX * 2;
    const sh = box.height + marginY * 2;
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, size, size);
  } else {
    ctx.drawImage(source, 0, 0, size, size);
  }

  return canvas.toDataURL("image/jpeg", 0.85);
}
