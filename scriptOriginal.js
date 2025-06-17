(async function() {
    const pontuation = document.getElementById("visor");
    const canvas = document.getElementById("canvas");
    const gl = canvas.getContext("webgl");
  
    // Vertex shader com cor
    const vsSource = `
      attribute vec2 coordinates;
      attribute vec3 aColor;
      uniform vec2 translation;
      varying vec3 vColor;
      void main(void) {
        gl_Position = vec4(coordinates + translation, 0.0, 1.0);
        vColor = aColor;
        gl_PointSize = 2.0;
      }
    `;
  
    // Fragment shader recebendo cor interpolada
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
        console.error(gl.getShaderInfoLog(shader));
      }
      return shader;
    }
  
    // Inicializa programa
    const vertexShader = createShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
  
    const coordLoc = gl.getAttribLocation(program, "coordinates");
    const colorLoc = gl.getAttribLocation(program, "aColor");
    const transLoc = gl.getUniformLocation(program, "translation");
  
    // Cria buffer e envia dados
    function initBuffer(dataArray) {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, dataArray, gl.STATIC_DRAW);
      return buf;
    }
  
    // Carrega JSON com posições e cores
    async function getJsonData(url, w, h) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erro ao carregar ${url}: ${res.status}`);
      const pixels = await res.json();
      const positions = [];
      const colors = [];
      for (const p of pixels) {
        // normaliza posição
        const x = (p.x / w) * 2 - 1;
        const y = -(p.y / h) * 2 + 1;
        positions.push(x, y);
        // extrai r,g,b da string 'rgba(r, g, b, a)'
        const match = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/.exec(p.color);
        let r = 0, g = 0, b = 0;
        if (match) {
          r = Number(match[1]);
          g = Number(match[2]);
          b = Number(match[3]);
        }
        // normaliza cor (0-255)
        colors.push(r/255, g/255, b/255);
      }
      return {
        positionArray: new Float32Array(positions),
        colorArray:    new Float32Array(colors)
      };
    }
  
    // Inicializa buffers dos objetos
    const JetPacKjsonData = await getJsonData('ImagesJson/JetPackGuyPixels.json', canvas.width, canvas.height);
    const posBuffer   = initBuffer(JetPacKjsonData.positionArray);
    const colorBuffer = initBuffer(JetPacKjsonData.colorArray);
    const vertexCount = JetPacKjsonData.positionArray.length / 2;
    
    const VerticalObstaclejsonData = await getJsonData('ImagesJson/VerticalObstaclePixels.json', canvas.width, canvas.height);
    const posVerticalBuffer   = initBuffer(VerticalObstaclejsonData.positionArray);
    const colorVerticalBuffer = initBuffer(VerticalObstaclejsonData.colorArray);
    const vertexVerticalCount = VerticalObstaclejsonData.positionArray.length / 2;
    
    const HorizontalObstaclejsonData = await getJsonData('ImagesJson/HorizontalObstaclePixels.json', canvas.width, canvas.height);
    const posHorizontalBuffer   = initBuffer(HorizontalObstaclejsonData.positionArray);
    const colorHorizontalBuffer = initBuffer(HorizontalObstaclejsonData.colorArray);
    const vertexHorizontalCount = HorizontalObstaclejsonData.positionArray.length / 2;
    
    const BackgroundjsonData = await getJsonData('ImagesJson/BackgroundPixels.json', canvas.width, canvas.height);
    const posBackgroundBuffer   = initBuffer(BackgroundjsonData.positionArray);
    const colorBackgroundBuffer = initBuffer(BackgroundjsonData.colorArray);
    const vertexBackgroundCount = BackgroundjsonData.positionArray.length / 2;
  
    const floorBuffer   = initBuffer(new Float32Array([-1, -1, 1, -1]));
    const pointBuffer = initBuffer(new Float32Array([-1, 0, 1, 0]));
    const ceilingBuffer = initBuffer(new Float32Array([-1, 0.5, 1, 0.5]));
    
    const verticalObstacleVerts = new Float32Array([
      -0.05, -0.2, 
      0.05, -0.2,
      0.05,  0.2, 
      -0.05,  0.2,
      -0.05, -0.2
    ]);
    const verticalObstacleBuffer = initBuffer(verticalObstacleVerts);
    
    const horizontalObstacleVerts = new Float32Array([
      -0.2, -0.05, 
      0.2, -0.05,
      0.2,  0.05, 
      -0.2,  0.05,
      -0.2, -0.05
    ]);
    const horizontalObstacleBuffer = initBuffer(horizontalObstacleVerts);
    
    const obsCount = horizontalObstacleVerts.length / 2;
  
    // Estado do jogo
    let y = -0.8, velocity = 0, gravity = -0.001;
    let x1 = 1, x2 = 1, x3 = 1;
    let backgroundX = 0;
    let obstacleVelocity = 0.01;
    let y1,y2,y3 = 0;
    let jumping = false;
    let points = 0;
  
    //Funcao para a geracao de pontos pelo tempo/distancia percorrida
    setInterval (()=> {
      points += 1;
      obstacleVelocity += 0.00003;
      pontuation.textContent = points.toString().padStart(4, '0') + ' m';
    },100);
  
    function getRandomFloat(min, max) {
      return Math.random() * (max - min) + min;
    }
  
    //EventListener Pulo, SpaceBar/Seta
    document.addEventListener('keydown', e => {
      if ((e.code === 'Space' || e.code === 'ArrowUp')) {
        if (y > -0.7) {
          velocity = 0.023;
        } else{
          velocity = 0.03;

        }
        jumping = true;
      }
    });
  
    //Desenho de Objetos Pixelados
    function draw(buffer,colorBuffer, count, mode, translation) {
      // Posiciona vértices
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(coordLoc, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(coordLoc);
  
      // Posiciona cores
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(colorLoc);
  
      // Aplica translação e desenha
      gl.uniform2fv(transLoc, translation);
      gl.drawArrays(mode, 0, count);
    }
  
    //Desenho De Objetos nao pixelados
    function drawSimple(buffer, count, mode, translation) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(coordLoc, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(coordLoc);
      gl.uniform2fv(transLoc, translation);
      gl.drawArrays(mode, 0, count);
    }
  
    function animate() {
      gl.clearColor(1,1,1,1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      backgroundX -= obstacleVelocity;
      if (backgroundX <= -1.5){
        backgroundX = 0;
      }

      // Física do salto
      y += velocity;
      velocity += gravity;
  
      //Chão
      if (y <= -0.7) { 
          y = -0.7; 
          velocity = 0; 
          jumping = false; 
      }
      //Teto
      if (y >= 0.5) { 
          y = 0.5; 
          jumping = false; 
      }
  
      //Obstáculo Horizontal
      x1 -= obstacleVelocity; 
      if (x1 <= -1.4) {
        x1 = 1.4;
        y1 = getRandomFloat(-1, 0.4);
      }
  
      //Obstaculos Verticais
      x2 -= obstacleVelocity; 
      x3 -= obstacleVelocity + 0.5;

      if (x2 <= -1.5){
        x2 = 1.05;
        
        // Gera posições evitando colisões entre obstáculos
        let attempts = 0;
        const maxAttempts = 50;
        
        do {
          y2 = getRandomFloat(-0.7, 0.3);
          y3 = getRandomFloat(-0.7, 0.3);
          attempts++;
          
          // Se não conseguir encontrar posição válida, relaxa as condições
          if (attempts > maxAttempts) {
            console.warn("Muitas tentativas - usando posições com menor restrição");
            break;
          }
        } while (
          Math.abs(y2 - y3) <= 0.8 ||           // Verticais muito próximos entre si
          Math.abs(y1 - y2) < 0.25 ||           // Vertical 1 muito próximo do horizontal
          Math.abs(y1 - y3) < 0.25              // Vertical 2 muito próximo do horizontal
        );
      }

      /*
      if (x2 <= -1.5){
        x2 = 1.05;
        y2 = getRandomFloat(-0.8, 0.3);
        y3 = getRandomFloat(-0.8, 0.3);

        while (Math.abs(y2 - y3) <= 0.8){ 
          y2 = getRandomFloat(-0.8, 0.3);
          y3 = getRandomFloat(-0.8, 0.3);
          */

          //--- Obstaculos Verticais != Obs Horizontais ---
        //   if(Math.abs(y1 - y2) < 0.25){
        //     y2 = getRandomFloat(-0.8, 0.3);
        //   }

        //   if(Math.abs(y1 - y3) < 0.25){
        //     y2 = getRandomFloat(-0.8, 0.3);
        //   }
          //------------------------------------------------

      
  
      // desenha chão e teto
      drawSimple(floorBuffer, 2, gl.LINES, [0,0]);
      drawSimple(pointBuffer, 2, gl.LINES, [0,0]);
      drawSimple(ceilingBuffer, 2, gl.LINES, [0,0]);
      // desenha personagem com cores
      draw(posBackgroundBuffer, colorBackgroundBuffer,vertexBackgroundCount,gl.POINTS,[(backgroundX + 0), (-0.5)]);
      draw(posBackgroundBuffer, colorBackgroundBuffer,vertexBackgroundCount,gl.POINTS,[(backgroundX + 1.5), (-0.5)]);
      draw(posBackgroundBuffer, colorBackgroundBuffer,vertexBackgroundCount,gl.POINTS,[(backgroundX + 3), (-0.5)]);
      draw(posHorizontalBuffer, colorHorizontalBuffer,vertexHorizontalCount,gl.POINTS,[(x1 + 0.8), (y1-0.8)]);
      draw(posVerticalBuffer, colorVerticalBuffer,vertexVerticalCount,gl.POINTS,[(x2 + 0.8), (y2-0.8)]);
      draw(posVerticalBuffer, colorVerticalBuffer,vertexVerticalCount,gl.POINTS,[(x2 + 1.3), (y3-0.8)]);
      draw(posBuffer,colorBuffer, vertexCount, gl.POINTS, [0, (y-0.91)]);
      // desenha obstáculos
      // drawSimple(horizontalObstacleBuffer, obsCount, gl.LINE_STRIP, [x1, y1]);
      // drawSimple(verticalObstacleBuffer, obsCount, gl.LINE_STRIP, [x2, y2]);
      // drawSimple(verticalObstacleBuffer, obsCount, gl.LINE_STRIP, [x2+0.5, y3]);
      //drawSimple(posBuffer, vertexCount, gl.LINE_STRIP, [0, (y-0.91)]);
      
      requestAnimationFrame(animate);
  
      //Conferir colisao do jogador com obstaculos
      

    }
  
    gl.viewport(0, 0, canvas.width, canvas.height);
    animate();
  })();