var canvas;
var gl;
var vertices;
let right = true, score = 0, jump = 0, height = 20, nextCoin = [], scores = [];
let xmove, ymove, colorLoc;

/**
 * Býr til Marius okkar.
 */
function makeMarius() {
    vertices = [
        vec2(-0.8, -1),
        vec2(-0.8, -0.9),
        vec2(-0.65, -0.9),
        vec2(-0.8, -0.7)
    ];
}

/**
 * Bætir hnitum fyrir gullmola inn í vertices.
 * @param {*} offset gefur til kynna hvar í fylkinu molinn kemur fyrir
 */
function coin(offset) {
    nextCoin[offset - 1] = Math.random() * 200 + 100;
    let cX = Math.random() * 1.95 - 1;
    let cY;
    if (Math.random() > 0.5) cY = -0.05;
    else cY = -1;
    vertices[4 * offset] = vec2(cX, cY + 0.1);
    vertices[4 * offset + 1] = vec2(cX, cY);
    vertices[4 * offset + 2] = vec2(cX + 0.05, cY);
    vertices[4 * offset + 3] = vec2(cX + 0.05, cY + 0.1);
}

/**
 * Athugar hvort Marius hafi rekist á annan gullmolann.
 * @param {*} offset Gefur til kynna hvar í vertices fyrsta hnit molans er
 */
function collision(offset) {
    const mY = vertices[0][1];
    const cX = vertices[offset][0];
    const cY = vertices[offset][1];
    if (right) {
        const mX = vertices[0][0];
        if (mX <= cX + 0.05 && mX + 0.15 >= cX && mY <= cY - 0.1 && mY + 0.3 >= cY) {
            for (i = 0; i < 4; i++) vertices[offset + i] = vec2(0, 0);
            addScore();
        }
    }
    else {
        const mX = vertices[2][0];
        if (mX <= cX + 0.05 && mX + 0.15 >= cX && mY <= cY - 0.1 && mY + 0.3 >= cY) {
            for (i = 0; i < 4; i++) vertices[offset + i] = vec2(0, 0);
            addScore();
        }
    }
}

/**
 *  Bætir við stigum efst á skjánum.
 */
function addScore() {
    const offset = 12 + 4 * (score);
    vertices[offset] = vec2(-0.9 + 0.07 * score, 0.9);
    vertices[offset + 1] = vec2(-0.9 + 0.07 * score, 0.8);
    vertices[offset + 2] = vec2(-0.85 + 0.07 * score, 0.8);
    vertices[offset + 3] = vec2(-0.85 + 0.07 * score, 0.9);
    if (score < 10) score++;
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    sigur = document.getElementById("sigur");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 1, 1, 1.0);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    sigur.style.visibility = 'hidden';
    makeMarius();
    coin(1);
    coin(2);
    for (i = 12; i < 60; i++) vertices[i] = vec2(0, 0);
    xmove = 0;
    ymove = 0;
    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.DYNAMIC_DRAW);

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    colorLoc = gl.getUniformLocation(program, "fColor");

    // Event listener for keyboard
    window.addEventListener("keydown", function (e) {
        switch (e.keyCode) {
            case 37:	// vinstri �r
                if (jump) break;
                if(score>=10) {
                    xmove = 0.0;
                    break;
                }
                if (right) {
                    right = false;
                    vertices[2][0] -= 0.3;
                    xmove = 0;
                }
                else if (vertices[0][0] <= -0.95) {
                    for (i = 0; i < 4; i++) {
                        if (i == 2) vertices[i][0] = 0.85;
                        else vertices[i][0] = 1;
                    }
                }
                else xmove = -0.04;
                break;
            case 39:	// h�gri �r
                if (jump) break;
                if(score>=10) {
                    xmove = 0.0;
                    break;
                }
                if (!right) {
                    right = true;
                    vertices[2][0] += 0.3;
                    xmove = 0.0;
                }
                else if (vertices[0][0] >= 0.95) {
                    for (i = 0; i < 4; i++) {
                        if (i == 2) vertices[i][0] = -0.85;
                        else vertices[i][0] = -1;
                    }
                }
                else xmove = 0.04;
                break;
            case 32:
                if (jump || score >= 10) break;
                jump = height;
                if (right && xmove != 0) xmove = 0.01;
                else if (xmove != 0) xmove = -0.01;
                break;
            default:
                xmove = 0.0;
        }
        if (jump == 0)
            for (i = 0; i < 4; i++) {
                vertices[i][0] += xmove;
            }

        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices));
    });

    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (score < 10) {
        if (jump > 0) {
            if (jump > height / 2) ymove = 0.1;
            else ymove = -0.1;
            if (xmove != 0 && jump % 2 == 1) {
                if (right) xmove = 0.05;
                else xmove = -0.05;
            }
            else if (xmove != 0) xmove = 0.01;
            for (i = 0; i < 4; i++) {
                vertices[i][1] += ymove;
                vertices[i][0] += xmove;
            }
            jump--;
        }
        for (i = 0; i < 2; i++) {
            if (nextCoin[i] <= 0) coin(i + 1);
            else nextCoin[i]--;
        }
        collision(4);
        collision(8);
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices));

    // Teikna buxurnar á Marius
    gl.uniform4fv(colorLoc, vec4(0.0, 0.0, 1.0, 1.0));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Teikna búkinn á Marius (so no head?)
    gl.uniform4fv(colorLoc, vec4(1.0, 0.0, 0.0, 1.0));
    gl.drawArrays(gl.TRIANGLES, 1, 3);

    // Teikna gullmolana
    gl.uniform4fv(colorLoc, vec4(1.0, 1.0, 0.0, 1.0));
    gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 8, 4);
    gl.uniform4fv(colorLoc, vec4(0.0, 1.0, 0.0, 1.0));
    for (i = 12; i < 52; i += 4) gl.drawArrays(gl.TRIANGLE_FAN, i, 4);
    if (score >= 10) sigur.style.visibility = 'visible';
    window.requestAnimFrame(render);
}