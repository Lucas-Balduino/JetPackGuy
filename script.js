(async function () {
  const pontuation = document.getElementById("visor");
  const canvas = document.getElementById("canvas");
  const gl = canvas.getContext("webgl");

  // Verifica se o contexto WebGL foi obtido
  if (!gl) {
    console.error("WebGL não é suportado ou falhou ao inicializar.");
    alert("Seu navegador não suporta WebGL. Tente usar um navegador moderno.");
    return;
  }

  // Vertex shader - CORRIGIDO: invertemos o Y para corrigir orientação
  const vsSource = `
        attribute vec2 coordinates;
        attribute vec3 aColor;
        uniform vec2 translation;
        uniform float isBackground;
        varying vec3 vColor;
        void main(void) {
            vec2 pos = coordinates;
            if (isBackground < 0.5) {
                pos = vec2(coordinates.x, -coordinates.y);
            }
            gl_Position = vec4(pos + translation, 0.0, 1.0);
            vColor = aColor;
            gl_PointSize = 4.0;
        }
    `;

  // Fragment shader
  const fsSource = `
        precision mediump float;
        varying vec3 vColor;
        void main(void) {
            gl_FragColor = vec4(vColor, 1.0);
        }
    `;

  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Erro ao compilar shader:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  // Inicializa programa
  const vertexShader = createShader(gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource);
  if (!vertexShader || !fragmentShader) {
    console.error("Falha ao criar shaders.");
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Erro ao vincular programa:", gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  const coordLoc = gl.getAttribLocation(program, "coordinates");
  const colorLoc = gl.getAttribLocation(program, "aColor");
  const transLoc = gl.getUniformLocation(program, "translation");
  const isBackgroundLoc = gl.getUniformLocation(program, "isBackground");

  function initBuffer(dataArray) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, dataArray, gl.STATIC_DRAW);
    return buf;
  }

  // Definir dimensões dos sprites
  const spriteWidth = 100;
  const spriteHeight = 100;

  async function getJsonData(url, w, h) {
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
        if (url === "ImagesJson/BackgroundPixels.json") {
          x = (p.x / w) * 2 - 1;
          y = -((p.y / h) * 2 - 1);
        } else {
          const scale = 0.3;
          x = (p.x / w) * scale - scale / 2;
          y = (p.y / h) * scale - scale / 2;
        }
        positions.push(x, y);

        // Parse da cor
        const match = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/.exec(
          p.color
        );
        let r = 0,
          g = 0,
          b = 0;
        if (match) {
          r = Number(match[1]);
          g = Number(match[2]);
          b = Number(match[3]);
        } else if (p.color.startsWith("#")) {
          const hex = p.color.slice(1);
          r = parseInt(hex.substr(0, 2), 16);
          g = parseInt(hex.substr(2, 2), 16);
          b = parseInt(hex.substr(4, 2), 16);
        }
        colors.push(r / 255, g / 255, b / 255);
      }

      console.log(`Carregado ${url}: ${pixels.length} pixels`);
      return {
        positionArray: new Float32Array(positions),
        colorArray: new Float32Array(colors),
      };
    } catch (error) {
      console.error("Erro ao carregar JSON:", error);
      return {
        positionArray: new Float32Array([]),
        colorArray: new Float32Array([]),
      };
    }
  }

  // Função para criar sprites de fallback
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

  // Cria background que cobre toda a tela
  function createFullBackground() {
    const positions = [];
    const colors = [];
    // Gera pontos de -1 a 1 cobrindo toda a tela
    for (let x = 0; x <= 550; x += 6) {
      for (let y = 0; y <= 540; y += 6) {
        // Normaliza para -1 a 1
        const nx = (x / 540) * 2 - 1;
        const ny = -((y / 540) * 2 - 1); // Inverte Y para ficar igual ao JetPackJogo.js
        positions.push(nx, ny);
        // Gradiente azul escuro
        const intensity = 0.1 + Math.random() * 0.1;
        colors.push(0, intensity, intensity * 2);
      }
    }
    return {
      positionArray: new Float32Array(positions),
      colorArray: new Float32Array(colors),
    };
  }

  // Carrega JSONs
  const jsonData = {};

  jsonData["ImagesJson/JetPackGuyPixels.json"] = await getJsonData(
    "ImagesJson/JetPackGuyPixels.json",
    100,
    100
  );
  jsonData["ImagesJson/VerticalObstaclePixels.json"] = await getJsonData(
    "ImagesJson/VerticalObstaclePixels.json",
    100,
    100
  );
  jsonData["ImagesJson/HorizontalObstaclePixels.json"] = await getJsonData(
    "ImagesJson/HorizontalObstaclePixels.json",
    100,
    100
  );
  jsonData["ImagesJson/BackgroundPixels.json"] = await getJsonData(
    "ImagesJson/BackgroundPixels.json",
    375,
    375
  );

  // Usa sprites de fallback se necessário
  if (jsonData["ImagesJson/JetPackGuyPixels.json"].positionArray.length === 0) {
    console.log("Usando sprite de fallback para o jogador");
    jsonData["ImagesJson/JetPackGuyPixels.json"] = createFallbackSprite(
      20,
      20,
      [0, 1, 0]
    );
  }

  if (
    jsonData["ImagesJson/VerticalObstaclePixels.json"].positionArray.length ===
    0
  ) {
    console.log("Usando sprite de fallback para obstáculo vertical");
    jsonData["ImagesJson/VerticalObstaclePixels.json"] = createFallbackSprite(
      10,
      40,
      [1, 1, 0]
    );
  }

  if (
    jsonData["ImagesJson/HorizontalObstaclePixels.json"].positionArray
      .length === 0
  ) {
    console.log("Usando sprite de fallback para obstáculo horizontal");
    jsonData["ImagesJson/HorizontalObstaclePixels.json"] = createFallbackSprite(
      40,
      10,
      [1, 1, 0]
    );
  }

  // Background que cobre toda a tela
  if (jsonData["ImagesJson/BackgroundPixels.json"].positionArray.length === 0) {
    console.log("Criando background completo");
    jsonData["ImagesJson/BackgroundPixels.json"] = createFullBackground();
  }

  // Inicializa buffers
  const posBuffer = initBuffer(
    jsonData["ImagesJson/JetPackGuyPixels.json"].positionArray
  );
  const colorBuffer = initBuffer(
    jsonData["ImagesJson/JetPackGuyPixels.json"].colorArray
  );
  const vertexCount =
    jsonData["ImagesJson/JetPackGuyPixels.json"].positionArray.length / 2;

  const posVerticalBuffer = initBuffer(
    jsonData["ImagesJson/VerticalObstaclePixels.json"].positionArray
  );
  const colorVerticalBuffer = initBuffer(
    jsonData["ImagesJson/VerticalObstaclePixels.json"].colorArray
  );
  const vertexVerticalCount =
    jsonData["ImagesJson/VerticalObstaclePixels.json"].positionArray.length / 2;

  const posHorizontalBuffer = initBuffer(
    jsonData["ImagesJson/HorizontalObstaclePixels.json"].positionArray
  );
  const colorHorizontalBuffer = initBuffer(
    jsonData["ImagesJson/HorizontalObstaclePixels.json"].colorArray
  );
  const vertexHorizontalCount =
    jsonData["ImagesJson/HorizontalObstaclePixels.json"].positionArray.length /
    2;

  const posBackgroundBuffer = initBuffer(
    jsonData["ImagesJson/BackgroundPixels.json"].positionArray
  );
  const colorBackgroundBuffer = initBuffer(
    jsonData["ImagesJson/BackgroundPixels.json"].colorArray
  );
  const vertexBackgroundCount =
    jsonData["ImagesJson/BackgroundPixels.json"].positionArray.length / 2;

  // Estado do jogo
  let y = -0.8,
    velocity = 0,
    gravity = -0.001;
  let x1 = 1.2,
    x2 = 1.8,
    x3 = 2.4;
  let obstacleVelocity = 0.015;
  let y1 = 0,
    y2 = 0,
    y3 = 0;
  let jumping = false;
  let points = 0;
  let gameOver = false;
  let gameStarted = false;
  let backgroundX = 0;
  let paused = false;

  const player = {
    width: 0.08,
    height: 0.08,
    x: -0.7,
    y: y,
  };

  const horizontalObstacle = {
    width: 0.25,
    height: 0.06,
  };

  const verticalObstacle = {
    width: 0.06,
    height: 0.25,
  };

  let pointsInterval;

  function startGame() {
    if (!gameStarted) {
      gameStarted = true;
      pointsInterval = setInterval(() => {
        if (!gameOver) {
          points += 1;
          obstacleVelocity += 0.00003;
          pontuation.textContent = points.toString().padStart(4, "0") + " m";
        }
      }, 100);
    }
  }

  function resetGame() {
    gameOver = false;
    gameStarted = false;
    y = -0.8;
    velocity = 0;
    x1 = 1.2;
    x2 = 1.8;
    x3 = 2.4;
    obstacleVelocity = 0.01;
    y1 = 0;
    y2 = 0;
    y3 = 0;
    points = 0;
    jumping = false;
    clearInterval(pointsInterval);
    pontuation.textContent = "0000 m";
  }

  function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  function checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  function checkAllCollisions() {
    player.y = y;

    // Colisão com bordas da tela
    if (y <= -0.85 || y >= 1) {
      gameOver = true;
      clearInterval(pointsInterval);
      return;
    }

    const horizontalObstRect = {
      x: x1 - horizontalObstacle.width / 2,
      y: y1 - horizontalObstacle.height / 2,
      width: horizontalObstacle.width,
      height: horizontalObstacle.height,
    };

    const verticalObst1Rect = {
      x: x2 - verticalObstacle.width / 2,
      y: y2 - verticalObstacle.height / 2,
      width: verticalObstacle.width,
      height: verticalObstacle.height,
    };

    const verticalObst2Rect = {
      x: x3 - verticalObstacle.width / 2,
      y: y3 - verticalObstacle.height / 2,
      width: verticalObstacle.width,
      height: verticalObstacle.height,
    };

    const playerRect = {
      x: player.x - player.width / 2,
      y: player.y - player.height / 2,
      width: player.width,
      height: player.height,
    };

    if (
      checkCollision(playerRect, horizontalObstRect) ||
      checkCollision(playerRect, verticalObst1Rect) ||
      checkCollision(playerRect, verticalObst2Rect)
    ) {
      gameOver = true;
      clearInterval(pointsInterval);
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      if (gameOver) {
        resetGame();
      } else {
        startGame();
            if (y > -0.7) {
              velocity = 0.023;
            } else {
              velocity = 0.03;
            }
            jumping = true;
          }
    }
  });

  // canvas.addEventListener('click', () => {
  //     if (gameOver) {
  //         resetGame();
  //     } else {
  //         startGame();
  //         velocity = 0.028;
  //         jumping = true;
  //     }
  // });

  document.getElementById("pauseBtn").onclick = function () {
    if (!gameOver) setPaused(!paused);
  };

  document.addEventListener("keydown", (e) => {
    if (e.code === "KeyP" && !gameOver) {
      setPaused(!paused);
    }
  });

  function draw(
    buffer,
    colorBuffer,
    count,
    mode,
    translation,
    isBackground = false
  ) {
    if (count === 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(coordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coordLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    gl.uniform2fv(transLoc, translation);
    gl.uniform1f(isBackgroundLoc, isBackground ? 1.0 : 0.0);
    gl.drawArrays(mode, 0, count);
  }

  function drawGameOverText() {
    const gameOverDiv = document.createElement("div");
    gameOverDiv.style.position = "absolute";
    gameOverDiv.style.top = "50%";
    gameOverDiv.style.left = "50%";
    gameOverDiv.style.transform = "translate(-50%, -50%)";
    gameOverDiv.style.color = "#ff4444";
    gameOverDiv.style.fontSize = "28px";
    gameOverDiv.style.fontWeight = "bold";
    gameOverDiv.style.textAlign = "center";
    gameOverDiv.style.pointerEvents = "none";
    gameOverDiv.style.zIndex = "100";
    gameOverDiv.innerHTML =
      'GAME OVER<br><span style="font-size: 18px;">Pressione ESPAÇO ou clique para reiniciar</span>';
    gameOverDiv.id = "gameOverText";

    const existingText = document.getElementById("gameOverText");
    if (existingText) {
      existingText.remove();
    }

    document.body.appendChild(gameOverDiv);
  }

  function setPaused(value) {
    paused = value;
    if (paused) {
      clearInterval(pointsInterval);
      showPauseOverlay();
    } else {
      if (gameStarted && !gameOver) {
        pointsInterval = setInterval(() => {
          if (!gameOver && !paused) {
            points += 1;
            obstacleVelocity += 0.00003;
            pontuation.textContent = points.toString().padStart(4, "0") + " m";
          }
        }, 100);
      }
      hidePauseOverlay();
    }
  }

  function showPauseOverlay() {
    let pauseDiv = document.getElementById("pauseOverlay");
    if (!pauseDiv) {
      pauseDiv = document.createElement("div");
      pauseDiv.id = "pauseOverlay";
      pauseDiv.style.position = "absolute";
      pauseDiv.style.top = "50%";
      pauseDiv.style.left = "50%";
      pauseDiv.style.transform = "translate(-50%, -50%)";
      pauseDiv.style.color = "#fff";
      pauseDiv.style.fontSize = "32px";
      pauseDiv.style.fontWeight = "bold";
      pauseDiv.style.textAlign = "center";
      pauseDiv.style.pointerEvents = "none";
      pauseDiv.style.zIndex = "101";
      pauseDiv.style.textShadow = "0 0 10px #000";
      pauseDiv.innerHTML = "PAUSADO";
      document.body.appendChild(pauseDiv);
    }
  }

  function hidePauseOverlay() {
    const pauseDiv = document.getElementById("pauseOverlay");
    if (pauseDiv) pauseDiv.remove();
  }

  function animate() {
    gl.clearColor(0.02, 0.05, 0.15, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Só atualiza movimento se não estiver pausado e não estiver em game over
    if (!gameOver && !paused) {
      // Atualize o deslocamento do fundo
      backgroundX -= obstacleVelocity * 1; // ajuste a velocidade do fundo aqui
      if (backgroundX <= -2) {
        backgroundX = 0;
      }

      if (!gameOver) {
        const gameOverText = document.getElementById("gameOverText");
        if (gameOverText) {
          gameOverText.remove();
        }

        if (gameStarted) {
          y += velocity;
          velocity += gravity;
        }

        // Limites da tela
        if (y <= -0.8) {
          y = -0.8;
          velocity = 0;
          jumping = false;
        }
        if (y >= 0.93) {
          y = 0.93;
          velocity = Math.min(velocity, 0);
        }

        if (gameStarted) {
          x1 -= obstacleVelocity;
          if (x1 <= -1.5) {
            x1 = 1.5;
            y1 = getRandomFloat(-0.8, 0.8);
          }

          x2 -= obstacleVelocity;
          if (x2 <= -1.5) {
            x2 = 1.8;
            y2 = getRandomFloat(-0.8, 0.8);
          }

          x3 -= obstacleVelocity;
          if (x3 <= -1.5) {
            x3 = 2.1;
            y3 = getRandomFloat(-0.8, 0.8);
          }

          checkAllCollisions();
        }
      } else {
        drawGameOverText();
      }
    } else if (gameOver) {
      drawGameOverText();
    }

    // Sempre desenha a cena (para mostrar overlay de pausa/game over)
    if (vertexBackgroundCount > 0) {
      draw(
        posBackgroundBuffer,
        colorBackgroundBuffer,
        vertexBackgroundCount,
        gl.POINTS,
        [backgroundX, 0],
        true
      );
      draw(
        posBackgroundBuffer,
        colorBackgroundBuffer,
        vertexBackgroundCount,
        gl.POINTS,
        [backgroundX + 2, 0],
        true
      );
    //   draw(
    //     posBackgroundBuffer,
    //     colorBackgroundBuffer,
    //     vertexBackgroundCount,
    //     gl.POINTS,
    //     [backgroundX + 4, 0],
    //     true
    //   );
    }
    draw(
      posHorizontalBuffer,
      colorHorizontalBuffer,
      vertexHorizontalCount,
      gl.POINTS,
      [x1, y1]
    );
    draw(
      posVerticalBuffer,
      colorVerticalBuffer,
      vertexVerticalCount,
      gl.POINTS,
      [x2, y2]
    );
    draw(
      posVerticalBuffer,
      colorVerticalBuffer,
      vertexVerticalCount,
      gl.POINTS,
      [x3, y3]
    );
    draw(posBuffer, colorBuffer, vertexCount, gl.POINTS, [player.x, y]);

    requestAnimationFrame(animate);
  }

  // Log de debug
  console.log("Inicializando jogo...");
  console.log("Vértices do jogador:", vertexCount);
  console.log("Vértices obstáculo vertical:", vertexVerticalCount);
  console.log("Vértices obstáculo horizontal:", vertexHorizontalCount);
  console.log("Vértices background:", vertexBackgroundCount);

  gl.viewport(0, 0, canvas.width, canvas.height);
  animate();
})();
