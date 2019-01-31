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



function initializeBuffers(GL, shape, colors) {
    // Create a buffer for the square's positions.
    const positionBuffer = GL.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    GL.bindBuffer(GL.ARRAY_BUFFER, positionBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(shape), GL.STATIC_DRAW);


    
    const colorBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, colorBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(colors), GL.STATIC_DRAW);


    return {
        position: positionBuffer,
        color: colorBuffer,
    };
}



window.addEventListener('resize', drawScene, false)

let squareRotation = 0.0;

drawScene();

window.setInterval(drawScene, 5);

function drawScene() {
    GL.canvas.height = window.innerHeight;
    GL.canvas.width = window.innerWidth;
    GL.viewport(0, 0, GL.canvas.width, GL.canvas.height)
 
    const shape = [
        1 ,  1,
        -1  ,  1,
        1 , -1,
        -1  , -1,
    ];

    const colors = [
        1.0,  1.0,  1.0,  1.0,    // white
        1.0,  0.0,  0.0,  1.0,    // red
        0.0,  1.0,  0.0,  1.0,    // green
        0.0,  0.0,  1.0,  1.0,    // blue
      ];

    const buffers = initializeBuffers(GL, shape, colors);

    
    GL.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    GL.clearDepth(1.0);                 // Clear everything
    GL.enable(GL.DEPTH_TEST);           // Enable depth testing
    GL.depthFunc(GL.LEQUAL);            // Near things obscure far things

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

    mat4.translate(modelViewMatrix,     // destination matrix
        modelViewMatrix,     // matrix to translate
        [-0.0, 0.0, -6.0]);  // amount to translate

    mat4.rotate(modelViewMatrix,  // destination matrix
        modelViewMatrix,  // matrix to rotate
        squareRotation,   // amount to rotate in radians
        [0, 0, 1]);       // axis to rotate around

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        const numComponents = 2;  // pull out 2 values per iteration
        const type = GL.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        GL.bindBuffer(GL.ARRAY_BUFFER, buffers.position);
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
        // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        GL.bindBuffer(GL.ARRAY_BUFFER, buffers.color);
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
        const offset = 0;
        const vertexCount = 4;
        GL.drawArrays(GL.TRIANGLE_STRIP, offset, vertexCount);
    }
}


window.addEventListener("keypress", (e)=>{
    const distance = .05;
    switch(e.key){
        case 'w':
        {
            console.log('hi');
            squareRotation += 0.1;
            break;
        }
        case 's':
        {
            squareRotation -= 0.1;
            break;
        }
        case 'd':
        {
            break;
        }
        case 'a':
        {
            break;
        }
        
    }
})
