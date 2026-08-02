// Carregamento de sprites e fallbacks
export async function loadAllSprites() {
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

      return {
        positionArray: new Float32Array(positions),
        colorArray: new Float32Array(colors),
      };
    } catch (error) {
      console.error('Erro ao carregar JSON compacto:', error);
      return {
        positionArray: new Float32Array([]),
        colorArray: new Float32Array([]),
      };
    }
  }

  async function getJsonData(url, w, h, isBackground = false) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erro ao carregar ${url}: ${res.status}`);
      const pixels = await res.json();

      if (!pixels || pixels.length === 0) {
        console.warn(`Arquivo ${url} está vazio ou não contém pixels válidos`);
        return {
          positionArray: new Float32Array([]),
          colorArray: new Float32Array([]),
        };
      }

      const positions = [];
      const colors = [];

      for (const p of pixels) {
        let x, y;
        if (isBackground) {
          x = (p.x / w) * 2 - 1;
          y = -((p.y / h) * 2 - 1);
        } else {
          const scale = 0.3;
          x = (p.x / w) * scale - scale / 2;
          y = (p.y / h) * scale - scale / 2;
        }
        positions.push(x, y);

        const match = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/.exec(p.color);
        let r = 0,
          g = 0,
          b = 0;
        if (match) {
          r = Number(match[1]);
          g = Number(match[2]);
          b = Number(match[3]);
        } else if (p.color && p.color.startsWith && p.color.startsWith('#')) {
          const hex = p.color.slice(1);
          r = parseInt(hex.substr(0, 2), 16);
          g = parseInt(hex.substr(2, 2), 16);
          b = parseInt(hex.substr(4, 2), 16);
        }
        colors.push(r / 255, g / 255, b / 255);
      }

      return {
        positionArray: new Float32Array(positions),
        colorArray: new Float32Array(colors),
      };
    } catch (error) {
      console.error('Erro ao carregar JSON:', error);
      return {
        positionArray: new Float32Array([]),
        colorArray: new Float32Array([]),
      };
    }
  }

  function createFallbackSprite(width, height, color) {
    const positions = [];
    const colors = [];
    const scale = 0.1;

    for (let x = 0; x < width; x += 2) {
      for (let y = 0; y < height; y += 2) {
        const normX = (x / width) * scale - scale / 2;
        const normY = (y / height) * scale - scale / 2;
        positions.push(normX, normY);
        colors.push(color[0], color[1], color[2]);
      }
    }

    return {
      positionArray: new Float32Array(positions),
      colorArray: new Float32Array(colors),
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
    };
  }

  // Carrega os 4 JSONs de sprites em paralelo
  const [playerData, verticalData, horizontalData, backgroundData] = await Promise.all([
    getJsonData('ImagesJson/JetPackGuyPixels.json', 100, 100, false),
    getJsonData('ImagesJson/VerticalObstaclePixels.json', 100, 100, false),
    getJsonData('ImagesJson/HorizontalObstaclePixels.json', 100, 100, false),
    getCompactBackgroundData('ImagesJson/BackgroundPixels.compact.json'),
  ]);

  const player = playerData.positionArray.length === 0 ? createFallbackSprite(20, 20, [0, 1, 0]) : playerData;
  const vertical = verticalData.positionArray.length === 0 ? createFallbackSprite(10, 40, [1, 1, 0]) : verticalData;
  const horizontal = horizontalData.positionArray.length === 0 ? createFallbackSprite(40, 10, [1, 1, 0]) : horizontalData;
  const background = backgroundData.positionArray.length === 0 ? createFullBackground() : backgroundData;

  return { player, vertical, horizontal, background };
}
