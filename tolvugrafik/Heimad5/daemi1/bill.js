var canvas;
var gl;

// position of the track
var TRACK_RADIUS = 100.0;
var TRACK_INNER = 90.0;
var TRACK_OUTER = 110.0;
var TRACK_PTS = 100;

var BLUE = vec4(0.0, 0.0, 1.0, 1.0);
var RED = vec4(1.0, 0.0, 0.0, 1.0);
var YELLOW = vec4(1.0, 1.0, 0.1, 1.0);
var GRAY = vec4(0.4, 0.4, 0.4, 1.0);

var numCubeVertices = 36;
var numTrackVertices = 2 * TRACK_PTS + 2;
var numRoofVertices = 12;


// variables for moving car
var carDirection = 0.0;
var carXPos = 100.0;
var carYPos = 0.0;
var height = 0.0;

// current viewpoint
var view = 1;

var colorLoc;
var mvLoc;
var pLoc;
var proj;

var cubeBuffer;
var trackBuffer;
var roofBuffer;
var vPosition;

var eyeX;
var eyeY;
var spinX = 0;
var spinY = 0;
var origX = 0;
var origY = 0;

// the 36 vertices of the cube
var cVertices = [
    // front side:
    vec3(-0.5, 0.5, 0.5), vec3(-0.5, -0.5, 0.5), vec3(0.5, -0.5, 0.5),
    vec3(0.5, -0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(-0.5, 0.5, 0.5),
    // right side:
    vec3(0.5, 0.5, 0.5), vec3(0.5, -0.5, 0.5), vec3(0.5, -0.5, -0.5),
    vec3(0.5, -0.5, -0.5), vec3(0.5, 0.5, -0.5), vec3(0.5, 0.5, 0.5),
    // bottom side:
    vec3(0.5, -0.5, 0.5), vec3(-0.5, -0.5, 0.5), vec3(-0.5, -0.5, -0.5),
    vec3(-0.5, -0.5, -0.5), vec3(0.5, -0.5, -0.5), vec3(0.5, -0.5, 0.5),
    // top side:
    vec3(0.5, 0.5, -0.5), vec3(-0.5, 0.5, -0.5), vec3(-0.5, 0.5, 0.5),
    vec3(-0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, -0.5),
    // back side:
    vec3(-0.5, -0.5, -0.5), vec3(-0.5, 0.5, -0.5), vec3(0.5, 0.5, -0.5),
    vec3(0.5, 0.5, -0.5), vec3(0.5, -0.5, -0.5), vec3(-0.5, -0.5, -0.5),
    // left side:
    vec3(-0.5, 0.5, -0.5), vec3(-0.5, -0.5, -0.5), vec3(-0.5, -0.5, 0.5),
    vec3(-0.5, -0.5, 0.5), vec3(-0.5, 0.5, 0.5), vec3(-0.5, 0.5, -0.5)
];

// vertices for the roof
var roofVertices = [
    // one side
    vec3(0.5, -0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(0.0, 0.5, 1.0),
    vec3(0.0, 0.5, 1.0), vec3(0.0, -0.5, 1.0), vec3(0.5, -0.5, 0.5),
    // one side
    vec3(-0.5, 0.5, 0.5), vec3(-0.5, -0.5, 0.5), vec3(0.0, -0.5, 1.0),
    vec3(0.0, -0.5, 1.0), vec3(0.0, 0.5, 1.0), vec3(-0.5, 0.5, 0.5)
];


// vertices of the track
var tVertices = [];


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.7, 1.0, 0.7, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    createTrack();

    // VBO for the track
    trackBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, trackBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tVertices), gl.STATIC_DRAW);

    // VBO for the roof
    roofBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, roofBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(roofVertices), gl.STATIC_DRAW);

    // VBO for the cube
    cubeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cVertices), gl.STATIC_DRAW);


    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    colorLoc = gl.getUniformLocation(program, "fColor");

    mvLoc = gl.getUniformLocation(program, "modelview");

    // set projection
    pLoc = gl.getUniformLocation(program, "projection");
    proj = perspective(50.0, 1.0, 1.0, 500.0);
    gl.uniformMatrix4fv(pLoc, false, flatten(proj));

    document.getElementById("Viewpoint").innerHTML = "1: Fjarl??gt sj??narhorn";
    document.getElementById("Height").innerHTML = "Vi??b??tarh????: " + height;

    canvas.addEventListener("mousemove", function (e) {
        if (view == 0) {
            spinY = (spinY + (e.offsetX - origX)) % 360;
            spinX = (spinX + (e.offsetY - origY)) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    });

    // Event listener for keyboard
    window.addEventListener("keydown", function (e) {
        switch (e.keyCode) {
            case 48:
                view = 0;
                document.getElementById("Viewpoint").innerHTML = "0: Auga ?? fastri h????";
                eyeX = 100;
                eyeY = 100;
                break;
            case 49:	// 1: distant and stationary viewpoint
                view = 1;
                document.getElementById("Viewpoint").innerHTML = "1: Fjarl??gt sj??narhorn";
                break;
            case 50:	// 2: panning camera inside the track
                view = 2;
                document.getElementById("Viewpoint").innerHTML = "2: Horfa ?? b??linn innan ??r hringnum";
                break;
            case 51:	// 3: panning camera inside the track
                view = 3;
                document.getElementById("Viewpoint").innerHTML = "3: Horfa ?? b??linn fyrir utan hringinn";
                break;
            case 52:	// 4: driver's point of view
                view = 4;
                document.getElementById("Viewpoint").innerHTML = "4: Sj??narhorn ??kumanns";
                break;
            case 53:	// 5: drive around while looking at a house
                view = 5;
                document.getElementById("Viewpoint").innerHTML = "5: Horfa alltaf ?? eitt h??s innan ??r b??lnum";
                break;
            case 54:	// 6: Above and behind the car
                view = 6;
                document.getElementById("Viewpoint").innerHTML = "6: Fyrir aftan og ofan b??linn";
                break;
            case 55:	// 7: from another car in front
                view = 7;
                document.getElementById("Viewpoint").innerHTML = "7: Horft aftur ??r b??l fyrir framan";
                break;
            case 56:	// 8: from beside the car
                view = 8;
                document.getElementById("Viewpoint").innerHTML = "8: Til hli??ar vi?? b??linn";
                break;
            case 57:
                view = 9;
                document.getElementById("Viewpoint").innerHTML = "9: Ofan ?? h??si og horfir alltaf ?? b??linn";
                break;

            case 38:    // up arrow
                    height += 2.0;
                    document.getElementById("Height").innerHTML = "Vi??b??tarh????: " + height;
                    eyeX -= Math.cos(radians(spinX));
                    eyeY -= Math.sin(radians(spinY));
                break;
            case 40:    // down arrow
                height -= 2.0;
                document.getElementById("Height").innerHTML = "Vi??b??tarh????: " + height;
                eyeX += Math.cos(radians(spinX));
                eyeY += Math.sin(radians(spinY));
                break;
        }
    });

    render();
}


// create the vertices that form the car track
function createTrack() {

    var theta = 0.0;
    for (var i = 0; i <= TRACK_PTS; i++) {
        var p1 = vec3(TRACK_OUTER * Math.cos(radians(theta)), TRACK_OUTER * Math.sin(radians(theta)), 0.0);
        var p2 = vec3(TRACK_INNER * Math.cos(radians(theta)), TRACK_INNER * Math.sin(radians(theta)), 0.0)
        tVertices.push(p1);
        tVertices.push(p2);
        theta += 360.0 / TRACK_PTS;
    }
}


// draw a house in location (x, y) of size size
function house(x, y, size, mv) {

    mv = mult(mv, translate(x, y, size / 2));
    mv = mult(mv, scalem(size, size, size));

    // draw roof
    gl.uniform4fv(colorLoc, RED);
    gl.bindBuffer(gl.ARRAY_BUFFER, roofBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, numRoofVertices);

    // draw the walls
    gl.uniform4fv(colorLoc, YELLOW);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
}


// draw the circular track and a few houses (i.e. red cubes)
function drawScenery(mv) {

    // draw track
    gl.uniform4fv(colorLoc, GRAY);
    gl.bindBuffer(gl.ARRAY_BUFFER, trackBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, numTrackVertices);


    // draw houses    
    house(-20.0, 50.0, 5.0, mv);
    house(0.0, 70.0, 10.0, mv);
    house(20.0, -10.0, 8.0, mv);
    house(40.0, 120.0, 10.0, mv);
    house(-30.0, -50.0, 7.0, mv);
    house(10.0, -60.0, 10.0, mv);
    house(-20.0, 75.0, 8.0, mv);
    house(-40.0, 140.0, 10.0, mv);

}


// draw car as two blue cubes
function drawCar(mv) {

    // set color to blue
    gl.uniform4fv(colorLoc, BLUE);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    var mv1 = mv;
    // lower body of the car
    mv = mult(mv, scalem(10.0, 3.0, 2.0));
    mv = mult(mv, translate(0.0, 0.0, 0.5));

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);

    // upper part of the car
    mv1 = mult(mv1, scalem(4.0, 3.0, 2.0));
    mv1 = mult(mv1, translate(-0.2, 0.0, 1.5));

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    carDirection += 3.0;
    if (carDirection > 360.0) carDirection = 0.0;

    carXPos = TRACK_RADIUS * Math.sin(radians(carDirection));
    carYPos = TRACK_RADIUS * Math.cos(radians(carDirection));

    var mv = mat4();
    switch (view) {
        case 0:
            mv = lookAt(vec3(eyeX, eyeY, 5), vec3(spinX, spinY, 5), vec3(0.0, 0.0, 1.0));
            drawScenery(mv);
            mv = mult(mv, translate(carXPos, carYPos, 0.0));
            mv = mult(mv, rotateZ(carDirection));
            drawCar(mv);
            break;
        case 1:
            // Distant and stationary viewpoint
            mv = lookAt(vec3(250.0, 0.0, 100.0 + height), vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0));
            drawScenery(mv);
            mv = mult(mv, translate(carXPos, carYPos, 0.0));
            mv = mult(mv, rotateZ(carDirection));
            drawCar(mv);
            break;
        case 2:
            // Static viewpoint inside the track; camera follows car
            mv = lookAt(vec3(75.0, 0.0, 5.0 + height), vec3(carXPos, carYPos, 0.0), vec3(0.0, 0.0, 1.0));
            drawScenery(mv);
            mv = mult(mv, translate(carXPos, carYPos, 0.0));
            mv = mult(mv, rotateZ(carDirection));
            drawCar(mv);
            break;
        case 3:
            // Static viewpoint outside the track; camera follows car
            mv = lookAt(vec3(125.0, 0.0, 5.0 + height), vec3(carXPos, carYPos, 0.0), vec3(0.0, 0.0, 1.0));
            drawScenery(mv);
            mv = mult(mv, translate(carXPos, carYPos, 0.0));
            mv = mult(mv, rotateZ(carDirection));
            drawCar(mv);
            break;
        case 4:
            // Driver's point of view.
            mv = lookAt(vec3(-3.0, 0.0, 5.0 + height), vec3(12.0, 0.0, 2.0 + height), vec3(0.0, 0.0, 1.0));
            drawCar(mv);
            mv = mult(mv, rotateZ(-carDirection));
            mv = mult(mv, translate(-carXPos, -carYPos, 0.0));
            drawScenery(mv);
            break;
        case 5:
            // Drive around while looking at a house at (40, 120)
            mv = rotateY(carDirection);
            mv = mult(mv, lookAt(vec3(3.0, 0.0, 5.0 + height), vec3(40.0 - carXPos, 120.0 - carYPos, 0.0), vec3(0.0, 0.0, 1.0)));
            drawCar(mv);
            mv = mult(mv, rotateZ(-carDirection));
            mv = mult(mv, translate(-carXPos, -carYPos, 0.0));
            drawScenery(mv);
            break;
        case 6:
            // Behind and above the car
            mv = lookAt(vec3(-12.0, 0.0, 6.0 + height), vec3(15.0, 0.0, 4.0), vec3(0.0, 0.0, 1.0));
            drawCar(mv);
            mv = mult(mv, rotateZ(-carDirection));
            mv = mult(mv, translate(-carXPos, -carYPos, 0.0));
            drawScenery(mv);
            break;
        case 7:
            // View backwards looking from another car
            mv = lookAt(vec3(25.0, 5.0, 5.0 + height), vec3(0.0, 0.0, 2.0), vec3(0.0, 0.0, 1.0));
            drawCar(mv);
            mv = mult(mv, rotateZ(-carDirection));
            mv = mult(mv, translate(-carXPos, -carYPos, 0.0));
            drawScenery(mv);
            break;
        case 8:
            // View from beside the car
            mv = lookAt(vec3(2.0, 20.0, 5.0 + height), vec3(2.0, 0.0, 2.0), vec3(0.0, 0.0, 1.0));
            drawCar(mv);
            mv = mult(mv, rotateZ(-carDirection));
            mv = mult(mv, translate(-carXPos, -carYPos, 0.0));
            drawScenery(mv);
            break;
        case 9:
            // View from top of building in coordinates (-40, 140) looking at the car
            mv = lookAt(vec3(-40, 140, 20 + height), vec3(carXPos, carYPos, 0.0), vec3(0.0, 0.0, 1.0));
            drawScenery(mv);
            mv = mult(mv, translate(carXPos, carYPos, 0.0));
            mv = mult(mv, rotateZ(carDirection));
            drawCar(mv);
            break;
    }


    requestAnimFrame(render);
}