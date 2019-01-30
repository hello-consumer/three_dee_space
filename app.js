const VERTEX_SHADER_SOURCE = `
    attribute vec4 aVertexPosition;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
  `;

const FRAGMENT_SHADER_SOURCE = `
  void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
`;



const GRAPHICS_LIBRARY = document.querySelector('canvas').getContext('webgl')

const SHADER_PROGRAM = (() =>{
    const vertexShader = loadShader(GRAPHICS_LIBRARY, GRAPHICS_LIBRARY.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragmentShader = loadShader(GRAPHICS_LIBRARY, GRAPHICS_LIBRARY.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);

    // Create the shader program

    const shaderProgram = GRAPHICS_LIBRARY.createProgram();
    
    GRAPHICS_LIBRARY.attachShader(shaderProgram, vertexShader);
    GRAPHICS_LIBRARY.attachShader(shaderProgram, fragmentShader);
    GRAPHICS_LIBRARY.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!GRAPHICS_LIBRARY.getProgramParameter(shaderProgram, GRAPHICS_LIBRARY.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + GRAPHICS_LIBRARY.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
})();

const PROGRAM_INFO = {
    program: SHADER_PROGRAM,
    attribLocations: {
        vertexPosition: GRAPHICS_LIBRARY.getAttribLocation(SHADER_PROGRAM, 'aVertexPosition'),
    },
    uniformLocations: {
        projectionMatrix: GRAPHICS_LIBRARY.getUniformLocation(SHADER_PROGRAM, 'uProjectionMatrix'),
        modelViewMatrix: GRAPHICS_LIBRARY.getUniformLocation(SHADER_PROGRAM, 'uModelViewMatrix'),
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



function initializeBuffer(graphicsLibrary, shape) {
    // Create a buffer for the square's positions.

    const positionBuffer = graphicsLibrary.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.

    graphicsLibrary.bindBuffer(graphicsLibrary.ARRAY_BUFFER, positionBuffer);

    

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.

    graphicsLibrary.bufferData(graphicsLibrary.ARRAY_BUFFER,
        new Float32Array(shape),
        graphicsLibrary.STATIC_DRAW);
    return {
        position: positionBuffer,
    };
}


window.addEventListener('resize', drawScene, false)

drawScene();

function drawScene() {
    GRAPHICS_LIBRARY.canvas.height = window.innerHeight;
    GRAPHICS_LIBRARY.canvas.width = window.innerWidth;
    GRAPHICS_LIBRARY.viewport(0, 0, GRAPHICS_LIBRARY.canvas.width, GRAPHICS_LIBRARY.canvas.height)
 
    const shape = [-1,1,1,1,-1,-1,1,-1];

    const buffer = initializeBuffer(GRAPHICS_LIBRARY, shape);

    
    GRAPHICS_LIBRARY.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    GRAPHICS_LIBRARY.clearDepth(1.0);                 // Clear everything
    GRAPHICS_LIBRARY.enable(GRAPHICS_LIBRARY.DEPTH_TEST);           // Enable depth testing
    GRAPHICS_LIBRARY.depthFunc(GRAPHICS_LIBRARY.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    GRAPHICS_LIBRARY.clear(GRAPHICS_LIBRARY.COLOR_BUFFER_BIT | GRAPHICS_LIBRARY.DEPTH_BUFFER_BIT);

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = GRAPHICS_LIBRARY.canvas.width / GRAPHICS_LIBRARY.canvas.height;
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

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        const numComponents = 2;  // pull out 2 values per iteration
        const type = GRAPHICS_LIBRARY.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        GRAPHICS_LIBRARY.bindBuffer(GRAPHICS_LIBRARY.ARRAY_BUFFER, buffer.position);
        GRAPHICS_LIBRARY.vertexAttribPointer(
            PROGRAM_INFO.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        GRAPHICS_LIBRARY.enableVertexAttribArray(
            PROGRAM_INFO.attribLocations.vertexPosition);
    }

    // Tell WebGL to use our program when drawing

    GRAPHICS_LIBRARY.useProgram(PROGRAM_INFO.program);

    // Set the shader uniforms

    GRAPHICS_LIBRARY.uniformMatrix4fv(
        PROGRAM_INFO.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    GRAPHICS_LIBRARY.uniformMatrix4fv(
        PROGRAM_INFO.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);

    {
        const offset = 0;
        const vertexCount = 4;
        GRAPHICS_LIBRARY.drawArrays(GRAPHICS_LIBRARY.TRIANGLE_STRIP, offset, vertexCount);
    }
}

