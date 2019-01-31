const VERTEX_SHADER_SOURCE = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

const FRAGMENT_SHADER_SOURCE = `
  varying lowp vec4 vColor;

  void main() {
    gl_FragColor = vColor;
  }
`;


const GL = document.querySelector('canvas').getContext('webgl')

const SHADER_PROGRAM = (() =>{
    const vertexShader = loadShader(GL, GL.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragmentShader = loadShader(GL, GL.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);

    // Create the shader program

    const shaderProgram = GL.createProgram();
    
    GL.attachShader(shaderProgram, vertexShader);
    GL.attachShader(shaderProgram, fragmentShader);
    GL.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!GL.getProgramParameter(shaderProgram, GL.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + GL.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
})();

const PROGRAM_INFO = {
    program: SHADER_PROGRAM,
    attribLocations: {
        vertexPosition: GL.getAttribLocation(SHADER_PROGRAM, 'aVertexPosition'),
        vertexColor: GL.getAttribLocation(SHADER_PROGRAM, 'aVertexColor'),
    },
    uniformLocations: {
        projectionMatrix: GL.getUniformLocation(SHADER_PROGRAM, 'uProjectionMatrix'),
        modelViewMatrix: GL.getUniformLocation(SHADER_PROGRAM, 'uModelViewMatrix'),
    },
};


//X , Y , Z
const SHAPE = [
    //Front
    -1.0, -1.0, 1.0,
    1.0, -1.0, 1.0,
    1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,

    //Back
    -1.0, -1.0, -1.0,
    -1.0, 1.0, -1.0,
    1.0, 1.0, -1.0, 
    1.0, -1.0, -1.0,

    //Top
    -1.0, 1.0, -1.0,
    -1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 
    1.0, 1.0, -1.0,

    //Bottom
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0, 1.0, 
    -1.0, -1.0, 1.0,

    //Right
    1.0, -1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, 1.0, 1.0, 
    1.0, -1.0, 1.0,

    //Left
    -1.0, -1.0, -1.0,
    -1.0, -1.0, 1.0,
    -1.0, 1.0, 1.0, 
    -1.0, 1.0, -1.0,

];

const COLORS = [
    [1.0,  1.0,  1.0,  1.0],    // white
    [1.0,  0.0,  0.0,  1.0],    // red
    [0.0,  1.0,  0.0,  1.0],    // green
    [0.0,  0.0,  1.0,  1.0],    // blue
    [1.0,  1.0,  0.0,  1.0],    // yellow
    [1.0,  0.0,  1.0,  1.0],    // purple
    ];

const INDICES = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
    ];


function loadShader(graphicsLibrary, type, source) {
    const shader = graphicsLibrary.createShader(type);

    // Send the source to the shader object

    graphicsLibrary.shaderSource(shader, source);

    // Compile the shader program

    graphicsLibrary.compileShader(shader);

    // See if it compiled successfully

    if (!graphicsLibrary.getShaderParameter(shader, graphicsLibrary.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + graphicsLibrary.getShaderInfoLog(shader));
        graphicsLibrary.deleteShader(shader);
        return null;
    }
    return shader;
}

const BUFFERS = (() =>{
    // Create a buffer for the square's positions.
    const positionBuffer = GL.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    GL.bindBuffer(GL.ARRAY_BUFFER, positionBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(SHAPE), GL.STATIC_DRAW);

    var mappedColors = COLORS
        .map(color => [color, color, color, color])
        .reduce((previous_a, current_a) => previous_a.concat(current_a))
        .reduce((previous_b, current_b) => previous_b.concat(current_b));


    const colorBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, colorBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(mappedColors), GL.STATIC_DRAW);

    const indexBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, indexBuffer);

    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(INDICES), GL.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer
    };

})();




window.addEventListener('resize', drawScene, false);

let yaw_increase = false;
let yaw_decrease = false;

let roll_increase = false;
let roll_decrease = false;

let pitch_increase = false;
let pitch_decrease = false;

let magnification_increase = false;
let magnification_decrease = false;

let yaw = 0.0;
let roll = 0.0;
let pitch = 0.0;
let magnification = 0.0;

drawScene();

window.setInterval(drawScene, 20);

function drawScene() {
    GL.canvas.height = window.innerHeight;
    GL.canvas.width = window.innerWidth;
    GL.viewport(0, 0, GL.canvas.width, GL.canvas.height) 
    GL.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    GL.clearDepth(1.0);                 // Clear everything
    GL.enable(GL.DEPTH_TEST);           // Enable depth testing
    GL.depthFunc(GL.LEQUAL);            // Near things obscure far things

    if(magnification_increase){
        magnification += 0.1;
    }

    if(magnification_decrease){
        magnification -= 0.1;
    }

    if(pitch_increase){
        pitch += 0.1;
    }

    if(pitch_decrease){
        pitch -= 0.1;
    }

    if(roll_increase){
        roll += 0.1;
    }

    if(roll_decrease){
        roll -= 0.1;
    }

    if(yaw_increase){
        yaw += 0.1;
    }

    if(yaw_decrease){
        yaw -= 0.1;
    }

    

    // Clear the canvas before we start drawing on it.

    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.


    const fieldOfView = 45 * Math.PI / 180;   // in radians
    
    const aspect = GL.canvas.width / GL.canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.create();

    // Now move the drawing position a bit to where we want to
    // start drawing the square.

    const zoom = -6.0 + magnification;

    mat4.translate(modelViewMatrix,     // destination matrix
        modelViewMatrix,     // matrix to translate
        [-0.0, 0.0, zoom]);  // amount to translate

    mat4.rotate(modelViewMatrix,  // destination matrix
        modelViewMatrix,  // matrix to rotate
        yaw,   // amount to rotate in radians
        [0, 1, 0]);       // axis to rotate around

    mat4.rotate(modelViewMatrix,  // destination matrix
        modelViewMatrix,  // matrix to rotate
        roll,   // amount to rotate in radians
        [0, 0, 1]);       // axis to rotate around

    mat4.rotate(modelViewMatrix,  // destination matrix
        modelViewMatrix,  // matrix to rotate
        pitch,   // amount to rotate in radians
        [1, 0, 0]);       // axis to rotate around

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        const numComponents = 3;  // pull out 2 values per iteration
        const type = GL.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        GL.bindBuffer(GL.ARRAY_BUFFER, BUFFERS.position);
        GL.vertexAttribPointer(
            PROGRAM_INFO.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        GL.enableVertexAttribArray(
            PROGRAM_INFO.attribLocations.vertexPosition);
    }

    {
        const numComponents = 4;  // pull out 2 values per iteration
        const type = GL.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        const offset = 0;         // how many bytes inside the buffer to start from
        GL.bindBuffer(GL.ARRAY_BUFFER, BUFFERS.color);
        GL.vertexAttribPointer(
            PROGRAM_INFO.attribLocations.vertexColor,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        GL.enableVertexAttribArray(
            PROGRAM_INFO.attribLocations.vertexColor);
    }


    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, BUFFERS.indices);

    // Tell WebGL to use our program when drawing

    GL.useProgram(PROGRAM_INFO.program);

    // Set the shader uniforms

    GL.uniformMatrix4fv(
        PROGRAM_INFO.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    GL.uniformMatrix4fv(
        PROGRAM_INFO.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);

    {
        const vertexCount = 36;
        const type = GL.UNSIGNED_SHORT;
        const offset = 0;
        GL.drawElements(GL.TRIANGLES, vertexCount, type, offset);
    }
}

function handleInput(key, active){
    switch(key){
        case 'w':
        {
            pitch_decrease = active;
            break;
        }
        case 's':
        {
            pitch_increase = active;
            break;
        }
        case 'd':
        {
            yaw_increase = active;
            break;
        }
        case 'a':
        {
            yaw_decrease = active;
            break;
        }
        case 'q':
        {
            roll_increase = active;
            break;
        }
        case 'e':
        {
            roll_decrease = active;
            break;
        }
        case 'z':
        {
            magnification_increase = active;
            break;
        }
        case 'x':
        {
            magnification_decrease = active;
            break;
        }
    }
}

window.addEventListener("keydown", (e)=>{
    handleInput(e.key, true);
})



window.addEventListener("keyup", (e)=>{
    handleInput(e.key, false);
})