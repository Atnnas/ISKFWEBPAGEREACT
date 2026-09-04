/**
 * Utilidad de generación de Huella Digital de Hardware (Device Hardware Fingerprint)
 * 
 * Extrae características permanentes del procesador, GPU, pantalla, audio y arquitectura
 * del dispositivo. Estas características físicas no cambian cuando un usuario selecciona
 * "Borrar datos", "Borrar historial" o navega en pestaña de incógnito.
 */

// Hash de respaldo en JS puro en caso de ausencia de crypto.subtle
function fallbackHash(str) {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
}

/**
 * Obtiene la firma de renderizado WebGL (GPU y Vendor real del hardware)
 */
function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);

    return `${vendor}~${renderer}~${maxTexSize}~${maxRenderBufferSize}`;
  } catch {
    return 'webgl-error';
  }
}

/**
 * Obtiene la firma de rasterización Canvas 2D (variaciones microscópicas de fuentes y GPU)
 */
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial', sans-serif";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('ISKF Security🥋 123.45', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('ISKF Security🥋 123.45', 4, 17);

    return canvas.toDataURL();
  } catch {
    return 'canvas-error';
  }
}

/**
 * Obtiene la firma de procesamiento de audio por hardware
 */
async function getAudioFingerprint() {
  try {
    const AudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!AudioContextClass) return 'no-audio-context';

    const context = new AudioContextClass(1, 44100, 44100);
    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.reduction.value = -20;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    oscillator.connect(compressor);
    compressor.connect(context.destination);
    oscillator.start(0);

    const renderedBuffer = await context.startRendering();
    const channelData = renderedBuffer.getChannelData(0);
    let sum = 0;
    for (let i = 4500; i < 5000; i++) {
      sum += Math.abs(channelData[i]);
    }
    return sum.toString();
  } catch {
    return 'audio-error';
  }
}

/**
 * Genera el hash de huella digital de hardware único y permanente
 * @returns {Promise<string>} Hash SHA-256 de 64 caracteres
 */
export async function getHardwareFingerprint() {
  if (typeof window === 'undefined') return '';

  try {
    // 1. Dimensiones de pantalla ordenadas (mismo hash tanto vertical como horizontal)
    const screenDims = [window.screen.width, window.screen.height].sort((a, b) => a - b).join('x');
    const colorDepth = window.screen.colorDepth || 24;
    const pixelRatio = window.devicePixelRatio || 1;

    // 2. Capacidades de hardware de la CPU y pantalla
    const hardwareConcurrency = navigator.hardwareConcurrency || 0;
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const platform = navigator.platform || '';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const language = navigator.language || '';

    // 3. GPU y Renderizado Gráfico
    const webgl = getWebGLFingerprint();
    const canvas = getCanvasFingerprint();

    // 4. Procesamiento de audio
    let audio = 'pending';
    try {
      audio = await Promise.race([
        getAudioFingerprint(),
        new Promise(resolve => setTimeout(() => resolve('audio-timeout'), 150))
      ]);
    } catch {
      audio = 'audio-err';
    }

    const payload = [
      screenDims,
      colorDepth,
      pixelRatio,
      hardwareConcurrency,
      maxTouchPoints,
      platform,
      timezone,
      language,
      webgl,
      canvas,
      audio
    ].join('###');

    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      const msgUint8 = new TextEncoder().encode(payload);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    return fallbackHash(payload);
  } catch (err) {
    console.warn("Error generating hardware fingerprint:", err);
    return fallbackHash(
      (typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}_${navigator.userAgent}` : 'fallback')
    );
  }
}
