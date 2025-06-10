(async function() {
    const pontuation = document.getElementById("visor");
    const canvas = document.getElementById("canvas");
    const gl = canvas.getContext("webgl");

    // Verifica se o contexto WebGL foi obtido
    if (!gl) {
        console.error("WebGL não é suportado ou falhou ao inicializar.");
        alert("Seu navegador não suporta WebGL. Tente usar um navegador moderno.");
        return;
    }

    // Vertex shader
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

    function initBuffer(dataArray) {
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, dataArray, gl.STATIC_DRAW);
        return buf;
    }

    async function getJsonData(url, w, h) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Erro ao carregar ${url}: ${res.status}`);
            const pixels = await res.json();
            const positions = [];
            const colors = [];
            for (const p of pixels) {
                const x = (p.x / w) * 2 - 1;
                const y = -(p.y / h) * 2 + 1;
                positions.push(x, y);
                const match = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/.exec(p.color);
                let r = 0, g = 0, b = 0;
                if (match) {
                    r = Number(match[1]);
                    g = Number(match[2]);
                    b = Number(match[3]);
                }
                colors.push(r / 255, g / 255, b / 255);
            }
            return {
                positionArray: new Float32Array(positions),
                colorArray: new Float32Array(colors)
            };
        } catch (error) {
            console.error("Erro ao carregar JSON:", error);
            return null;
        }
    }

    // Carrega JSONs com tratamento de erro
    const jsonFiles = [
        'JetPackGuyPixels.json',
        'VerticalObstaclePixels.json',
        'HorizontalObstaclePixels.json',
        'BackgroundPixels.json'
    ];
    const jsonData = {};
    for (const file of jsonFiles) {
        jsonData[file] = await getJsonData(file, canvas.width, canvas.height);
        if (!jsonData[file]) {
            console.error(`Falha ao carregar ${file}. Verifique se o arquivo existe e está no caminho correto.`);
            return;
        }
    }

    // Inicializa buffers
    const posBuffer = initBuffer(jsonData['JetPackGuyPixels.json'].positionArray);
    const colorBuffer = initBuffer(jsonData['JetPackGuyPixels.json'].colorArray);
    const vertexCount = jsonData['JetPackGuyPixels.json'].positionArray.length / 2;

    const posVerticalBuffer = initBuffer(jsonData['VerticalObstaclePixels.json'].positionArray);
    const colorVerticalBuffer = initBuffer(jsonData['VerticalObstaclePixels.json'].colorArray);
    const vertexVerticalCount = jsonData['VerticalObstaclePixels.json'].positionArray.length / 2;

    const posHorizontalBuffer = initBuffer(jsonData['HorizontalObstaclePixels.json'].positionArray);
    const colorHorizontalBuffer = initBuffer(jsonData['HorizontalObstaclePixels.json'].colorArray);
    const vertexHorizontalCount = jsonData['HorizontalObstaclePixels.json'].positionArray.length / 2;

    const posBackgroundBuffer = initBuffer(jsonData['BackgroundPixels.json'].positionArray);
    const colorBackgroundBuffer = initBuffer(jsonData['BackgroundPixels.json'].colorArray);
    const vertexBackgroundCount = jsonData['BackgroundPixels.json'].positionArray.length / 2;

    const floorBuffer = initBuffer(new Float32Array([-1, -1, 1, -1]));
    const pointBuffer = initBuffer(new Float32Array([-1, 0, 1, 0]));
    const ceilingBuffer = initBuffer(new Float32Array([-1, 0.5, 1, 0.5]));

    const verticalObstacleVerts = new Float32Array([
        -0.05, -0.2,
        0.05, -0.2,
        0.05, 0.2,
        -0.05, 0.2,
        -0.05, -0.2
    ]);
    const verticalObstacleBuffer = initBuffer(verticalObstacleVerts);

    const horizontalObstacleVerts = new Float32Array([
        -0.2, -0.05,
        0.2, -0.05,
        0.2, 0.05,
        -0.2, 0.05,
        -0.2, -0.05
    ]);
    const horizontalObstacleBuffer = initBuffer(horizontalObstacleVerts);

    const obsCount = horizontalObstacleVerts.length / 2;

    // Estado do jogo
    let y = -0.8, velocity = 0, gravity = -0.001;
    let x1 = 1, x2 = 1, x3 = 1;
    let obstacleVelocity = 0.01;
    let y1 = 0, y2 = 0, y3 = 0;
    let jumping = false;
    let points = 0;
    let gameOver = false;
    let gameStarted = false;

    const player = {
        width: 0.15,
        height: 0.15,
        x: 0,
        y: y
    };

    const horizontalObstacle = {
        width: 0.4,
        height: 0.1
    };

    const verticalObstacle = {
        width: 0.1,
        height: 0.4
    };

    let pointsInterval;

    function startGame() {
        if (!gameStarted) {
            gameStarted = true;
            pointsInterval = setInterval(() => {
                if (!gameOver) {
                    points += 1;
                    obstacleVelocity += 0.00003;
                    pontuation.textContent = points.toString().padStart(4, '0') + ' m';
                }
            }, 100);    
        }
    }

    function resetGame() {
        gameOver = false;
        gameStarted = false;
        y = -0.8;
        velocity = 0;
        x1 = 1;
        x2 = 1;
        x3 = 1;
        obstacleVelocity = 0.01;
        y1 = 0;
        y2 = 0;
        y3 = 0;
        points = 0;
        jumping = false;
        clearInterval(pointsInterval);
        pontuation.textContent = '0000 m';
    }

    function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    function checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    function checkAllCollisions() {
        player.y = y;
        const horizontalObstRect = {
            x: x1 - horizontalObstacle.width / 2,
            y: y1 - horizontalObstacle.height / 2,
            width: horizontalObstacle.width,
            height: horizontalObstacle.height
        };

        const verticalObst1Rect = {
            x: x2 - verticalObstacle.width / 2,
            y: y2 - verticalObstacle.height / 2,
            width: verticalObstacle.width,
            height: verticalObstacle.height
        };

        const verticalObst2Rect = {
            x: (x2 + 0.5) - verticalObstacle.width / 2,
            y: y3 - verticalObstacle.height / 2,
            width: verticalObstacle.width,
            height: verticalObstacle.height
        };

        const playerRect = {
            x: player.x - player.width / 2,
            y: player.y - player.height / 2,
            width: player.width,
            height: player.height
        };

        if (checkCollision(playerRect, horizontalObstRect) ||
            checkCollision(playerRect, verticalObst1Rect) ||
            checkCollision(playerRect, verticalObst2Rect)) {
            gameOver = true;
            clearInterval(pointsInterval);
        }
    }

    document.addEventListener('keydown', e => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            if (gameOver) {
                resetGame();
            } else {
                startGame();
                velocity = 0.03;
                jumping = true;
            }
        }
    });

    function draw(buffer, colorBuffer, count, mode, translation) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(coordLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(coordLoc);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLoc);

        gl.uniform2fv(transLoc, translation);
        gl.drawArrays(mode, 0, count);
    }

    function drawSimple(buffer, count, mode, translation) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(coordLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(coordLoc);
        gl.uniform2fv(transLoc, translation);
        gl.drawArrays(mode, 0, count);
    }

    function drawGameOverText() {
        const gameOverDiv = document.createElement('div');
        gameOverDiv.style.position = 'absolute';
        gameOverDiv.style.top = '50%';
        gameOverDiv.style.left = '50%';
        gameOverDiv.style.transform = 'translate(-50%, -50%)';
        gameOverDiv.style.color = 'red';
        gameOverDiv.style.fontSize = '24px';
        gameOverDiv.style.fontWeight = 'bold';
        gameOverDiv.style.textAlign = 'center';
        gameOverDiv.style.pointerEvents = 'none';
        gameOverDiv.innerHTML = 'GAME OVER<br>Pressione ESPAÇO para reiniciar';
        gameOverDiv.id = 'gameOverText';

        const existingText = document.getElementById('gameOverText');
        if (existingText) {
            existingText.remove();
        }

        document.body.appendChild(gameOverDiv);
    }

    function animate() {
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (!gameOver) {
            const gameOverText = document.getElementById('gameOverText');
            if (gameOverText) {
                gameOverText.remove();
            }

            if (gameStarted) {
                y += velocity;
                velocity += gravity;
            }

            if (y <= -0.8) {
                y = -0.8;
                velocity = 0;
                jumping = false;
            }
            if (y >= 0.5) {
                y = 0.5;
                jumping = false;
            }

            if (gameStarted) {
                x1 -= obstacleVelocity;
                if (x1 <= -1.4) {
                    x1 = 1.4;
                    y1 = getRandomFloat(-0.8, 0.4);
                }

                x2 -= obstacleVelocity;
                x3 -= obstacleVelocity;
                if (x2 <= -1.5) {
                    x2 = 1.5;
                    y2 = getRandomFloat(-0.8, 0.3);
                    y3 = getRandomFloat(-0.8, 0.3);
                }

                checkAllCollisions();
            }
        } else {
            drawGameOverText();
        }

        // Desenha chão e teto
        drawSimple(floorBuffer, 2, gl.LINES, [0, 0]);
        drawSimple(ceilingBuffer, 2, gl.LINES, [0, 0]);

        // Desenha fundo
        draw(posBackgroundBuffer, colorBackgroundBuffer, vertexBackgroundCount, gl.POINTS, [x1, -0.5]);

        // Desenha obstáculos
        draw(posHorizontalBuffer, colorHorizontalBuffer, vertexHorizontalCount, gl.POINTS, [x1, y1]);
        draw(posVerticalBuffer, colorVerticalBuffer, vertexVerticalCount, gl.POINTS, [x2, y2]);
        draw(posVerticalBuffer, colorVerticalBuffer, vertexVerticalCount, gl.POINTS, [x3, y3]);

        // Desenha jogador
        draw(posBuffer, colorBuffer, vertexCount, gl.POINTS, [0, y]);

        requestAnimationFrame(animate);
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    animate();
})();