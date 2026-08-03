import { CONFIG } from './config.js';

function parseColor(color) {
  const match = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/.exec(color);
  if (match) {
    return [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  if (color && color.startsWith && color.startsWith('#')) {
    const hex = color.slice(1);
    return [
      parseInt(hex.substr(0, 2), 16),
      parseInt(hex.substr(2, 2), 16),
      parseInt(hex.substr(4, 2), 16),
    ];
  }
  return [0, 0, 0];
}

function pointSizeForSpacing(scale, pixelSpan, canvasSize) {
  const spacingPx = (scale / pixelSpan) * (canvasSize / 2);
  return Math.max(1, Math.min(spacingPx * 1.05, 4));
}

export async function loadAllSprites() {
  const spriteScale = CONFIG.render.spriteScale;
  const canvasSize = CONFIG.render.canvasSize;

  async function getCompactBackgroundData(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erro ao carregar ${url}: ${res.status}`);
      const { width, height, data } = await res.json();

      if (!data || data.length === 0) {
        console.warn(`Arquivo ${url} está vazio ou não contém pixels válidos`);
        return {
          positionArray: new Float32Array([]),
          colorArray: new Float32Array([]),
          pointSize: 1,
        };
      }

      const positions = [];
      const colors = [];

      for (let i = 0; i < data.length; i += 3) {
        const idx = i / 3;
        const px = idx % width;
        const py = Math.floor(idx / width);
        positions.push((px / width) * 2 - 1, -((py / height) * 2 - 1));
        colors.push(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
      }

      const span = Math.max(width, height);
      return {
        positionArray: new Float32Array(positions),
        colorArray: new Float32Array(colors),
        pointSize: pointSizeForSpacing(2, span, canvasSize),
      };
    } catch (error) {
      console.error('Erro ao carregar JSON compacto:', error);
      return {
        positionArray: new Float32Array([]),
        colorArray: new Float32Array([]),
        pointSize: 1,
      };
    }
  }

  async function getJsonData(url, sourceSize = 100) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erro ao carregar ${url}: ${res.status}`);
      const pixels = await res.json();

      if (!pixels || pixels.length === 0) {
        console.warn(`Arquivo ${url} está vazio ou não contém pixels válidos`);
        return {
          positionArray: new Float32Array([]),
          colorArray: new Float32Array([]),
          pointSize: 1,
          visualWidth: spriteScale,
          visualHeight: spriteScale,
        };
      }

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const p of pixels) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }

      const spanX = Math.max(1, maxX - minX);
      const spanY = Math.max(1, maxY - minY);
      // Centraliza no conteúdo, mas escala pelo quadro-fonte (100)
      // para o personagem não ocupar o mesmo tamanho que o obstáculo alto.
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const positions = [];
      const colors = [];

      for (const p of pixels) {
        const x = ((p.x - centerX) / sourceSize) * spriteScale;
        const y = ((p.y - centerY) / sourceSize) * spriteScale;
        positions.push(x, y);

        const [r, g, b] = parseColor(p.color);
        colors.push(r / 255, g / 255, b / 255);
      }

      return {
        positionArray: new Float32Array(positions),
        colorArray: new Float32Array(colors),
        pointSize: pointSizeForSpacing(spriteScale, sourceSize, canvasSize),
        visualWidth: (spanX / sourceSize) * spriteScale,
        visualHeight: (spanY / sourceSize) * spriteScale,
      };
    } catch (error) {
      console.error('Erro ao carregar JSON:', error);
      return {
        positionArray: new Float32Array([]),
        colorArray: new Float32Array([]),
        pointSize: 1,
        visualWidth: spriteScale,
        visualHeight: spriteScale,
      };
    }
  }

  function createFallbackSprite(width, height, color) {
    const positions = [];
    const colors = [];
    const maxSpan = Math.max(width, height);

    for (let x = 0; x < width; x += 2) {
      for (let y = 0; y < height; y += 2) {
        const normX = ((x - width / 2) / maxSpan) * spriteScale;
        const normY = ((y - height / 2) / maxSpan) * spriteScale;
        positions.push(normX, normY);
        colors.push(color[0], color[1], color[2]);
      }
    }

    return {
      positionArray: new Float32Array(positions),
      colorArray: new Float32Array(colors),
      pointSize: pointSizeForSpacing(spriteScale, maxSpan / 2, canvasSize),
      visualWidth: (width / maxSpan) * spriteScale,
      visualHeight: (height / maxSpan) * spriteScale,
    };
  }

  function createFullBackground() {
    const positions = [];
    const colors = [];
    for (let x = 0; x <= 550; x += 6) {
      for (let y = 0; y <= 540; y += 6) {
        const nx = (x / 540) * 2 - 1;
        const ny = -((y / 540) * 2 - 1);
        positions.push(nx, ny);
        const intensity = 0.1 + Math.random() * 0.1;
        colors.push(0, intensity, intensity * 2);
      }
    }
    return {
      positionArray: new Float32Array(positions),
      colorArray: new Float32Array(colors),
      pointSize: 6,
    };
  }

  const [playerData, verticalData, horizontalData, backgroundData] = await Promise.all([
    getJsonData('ImagesJson/JetPackGuyPixels.json'),
    getJsonData('ImagesJson/VerticalObstaclePixels.json'),
    getJsonData('ImagesJson/HorizontalObstaclePixels.json'),
    getCompactBackgroundData('ImagesJson/BackgroundPixels.compact.json'),
  ]);

  const player = playerData.positionArray.length === 0 ? createFallbackSprite(20, 20, [0, 1, 0]) : playerData;
  const vertical = verticalData.positionArray.length === 0 ? createFallbackSprite(10, 40, [1, 1, 0]) : verticalData;
  const horizontal = horizontalData.positionArray.length === 0 ? createFallbackSprite(40, 10, [1, 1, 0]) : horizontalData;
  const background = backgroundData.positionArray.length === 0 ? createFullBackground() : backgroundData;

  return { player, vertical, horizontal, background };
}
