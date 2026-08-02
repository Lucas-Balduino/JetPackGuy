export function createRenderer(canvas) {
  const gl = canvas.getContext('webgl');
  if (!gl) {
    console.error('WebGL não é suportado ou falhou ao inicializar.');
    alert('Seu navegador não suporta WebGL. Tente usar um navegador moderno.');
    throw new Error('WebGL unavailable');
  }

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
      console.error('Erro ao compilar shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = createShader(gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource);
  if (!vertexShader || !fragmentShader) {
    console.error('Falha ao criar shaders.');
    throw new Error('Shader creation failed');
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Erro ao vincular programa:', gl.getProgramInfoLog(program));
    throw new Error('Program link failed');
  }
  gl.useProgram(program);

  const coordLoc = gl.getAttribLocation(program, 'coordinates');
  const colorLoc = gl.getAttribLocation(program, 'aColor');
  const transLoc = gl.getUniformLocation(program, 'translation');
  const isBackgroundLoc = gl.getUniformLocation(program, 'isBackground');

  function createSpriteBuffers(positionArray, colorArray) {
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);

    const colorBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
    gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);

    const count = positionArray.length / 2;
    return { posBuffer: posBuf, colorBuffer: colorBuf, count };
  }

  function clear() {
    gl.clearColor(0.02, 0.05, 0.15, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  function setViewport(width, height) {
    gl.viewport(0, 0, width, height);
  }

  function drawSprite(buffers, translation, isBackground = false) {
    if (!buffers || buffers.count === 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.posBuffer);
    gl.vertexAttribPointer(coordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coordLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorBuffer);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    gl.uniform2fv(transLoc, translation);
    gl.uniform1f(isBackgroundLoc, isBackground ? 1.0 : 0.0);
    gl.drawArrays(gl.POINTS, 0, buffers.count);
  }

  return Object.freeze({
    createSpriteBuffers,
    clear,
    drawSprite,
    setViewport,
    gl, // expose gl only if needed elsewhere (but prefer not to use directly)
  });
}
