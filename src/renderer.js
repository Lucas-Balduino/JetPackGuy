export function createRenderer(canvas) {
  const gl = canvas.getContext('webgl');
  if (!gl) {
    console.error('WebGL não é suportado ou falhou ao inicializar.');
    alert('Seu navegador não suporta WebGL. Tente usar um navegador moderno.');
    throw new Error('WebGL unavailable');
  }

  const vsSource = `
        attribute vec2 coordinates;
        attribute vec4 aColor;
        uniform vec2 translation;
        uniform float isBackground;
        uniform float uPointSize;
        varying vec4 vColor;
        void main(void) {
            vec2 pos = coordinates;
            if (isBackground < 0.5) {
                pos = vec2(coordinates.x, -coordinates.y);
            }
            gl_Position = vec4(pos + translation, 0.0, 1.0);
            vColor = aColor;
            gl_PointSize = uPointSize;
        }
    `;

  const fsSource = `
        precision mediump float;
        varying vec4 vColor;
        void main(void) {
            gl_FragColor = vColor;
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
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const coordLoc = gl.getAttribLocation(program, 'coordinates');
  const colorLoc = gl.getAttribLocation(program, 'aColor');
  const transLoc = gl.getUniformLocation(program, 'translation');
  const isBackgroundLoc = gl.getUniformLocation(program, 'isBackground');
  const pointSizeLoc = gl.getUniformLocation(program, 'uPointSize');

  function createSpriteBuffers(positionArray, colorArray, pointSize = 1) {
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);

    const colorBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
    gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);

    const count = positionArray.length / 2;
    const colorComponents = colorArray.length === count * 4 ? 4 : 3;
    return { posBuffer: posBuf, colorBuffer: colorBuf, count, colorComponents, pointSize };
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
    gl.vertexAttribPointer(colorLoc, buffers.colorComponents || 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    gl.uniform2fv(transLoc, translation);
    gl.uniform1f(isBackgroundLoc, isBackground ? 1.0 : 0.0);
    gl.uniform1f(pointSizeLoc, buffers.pointSize ?? 1);
    gl.drawArrays(gl.POINTS, 0, buffers.count);
  }

  function drawPoints(positionArray, colorArray, pointSize = 3) {
    const count = positionArray.length / 2;
    if (count === 0) return;

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);

    const colorBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
    gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.vertexAttribPointer(coordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coordLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    gl.uniform2fv(transLoc, [0, 0]);
    gl.uniform1f(isBackgroundLoc, 0.0);
    gl.uniform1f(pointSizeLoc, pointSize);
    gl.drawArrays(gl.POINTS, 0, count);

    gl.deleteBuffer(posBuf);
    gl.deleteBuffer(colorBuf);
  }

  return Object.freeze({
    createSpriteBuffers,
    clear,
    drawSprite,
    drawPoints,
    setViewport,
  });
}
