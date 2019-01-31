const VERTEX_SHADER_SOURCE = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;

    // Apply lighting effect

    highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
    highp vec3 directionalLightColor = vec3(1, 0, 0);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

    highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

    highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
    vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;

const FRAGMENT_SHADER_SOURCE = `
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    uniform sampler2D uSampler;

    void main(void) {
    highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

    gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
    }
`;


const GL = document.querySelector('canvas').getContext('webgl')

const SHADER_PROGRAM = (() => {
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
        vertexNormal: GL.getAttribLocation(SHADER_PROGRAM, 'aVertexNormal'),
        textureCoordinates: GL.getAttribLocation(SHADER_PROGRAM, 'aTextureCoord'),
    },
    uniformLocations: {
        projectionMatrix: GL.getUniformLocation(SHADER_PROGRAM, 'uProjectionMatrix'),
        modelViewMatrix: GL.getUniformLocation(SHADER_PROGRAM, 'uModelViewMatrix'),
        normalMatrix: GL.getUniformLocation(SHADER_PROGRAM, 'uNormalMatrix'),
        uSampler: GL.getUniformLocation(SHADER_PROGRAM, 'uSampler'),
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

const INDICES = [
    0, 1, 2, 0, 2, 3,    // front
    4, 5, 6, 4, 6, 7,    // back
    8, 9, 10, 8, 10, 11,   // top
    12, 13, 14, 12, 14, 15,   // bottom
    16, 17, 18, 16, 18, 19,   // right
    20, 21, 22, 20, 22, 23,   // left
];

const TEXTURE_COORDINATES = [
    // Front
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Back
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Top
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Bottom
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Right
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Left
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
];


const VERTEX_NORMALS = [
    // Front
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,

    // Back
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,

    // Top
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,

    // Bottom
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,

    // Right
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,

    // Left
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0
  ];



function loadShader(graphicsLibrary, type, source) {
    const shader = graphicsLibrary.createShader(type);

    graphicsLibrary.shaderSource(shader, source);

    graphicsLibrary.compileShader(shader);

    if (!graphicsLibrary.getShaderParameter(shader, graphicsLibrary.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + graphicsLibrary.getShaderInfoLog(shader));
        graphicsLibrary.deleteShader(shader);
        return null;
    }
    return shader;
}

const TEXTURE_FILENAME = 'texture.jpg';
const TEXTURE = (() => {
    const texture = GL.createTexture();
    GL.bindTexture(GL.TEXTURE_2D, texture);
    //Placeholder pixel image while texture resourse loads
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA,
        GL.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.addEventListener("load",(e) => {
        GL.bindTexture(GL.TEXTURE_2D, texture);
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);

        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            GL.generateMipmap(GL.TEXTURE_2D);
        } else {
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
        }
    });
    image.src = TEXTURE_FILENAME;

    return texture;
})();

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

const BUFFERS = (() => {
    // Create a buffer for the square's positions.
    const positionBuffer = GL.createBuffer();
    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    GL.bindBuffer(GL.ARRAY_BUFFER, positionBuffer);
    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(SHAPE), GL.STATIC_DRAW);

    const textureCoordinatesBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, textureCoordinatesBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(TEXTURE_COORDINATES), GL.STATIC_DRAW);
  
    const indexBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, indexBuffer);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(INDICES), GL.STATIC_DRAW);


    const normalBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, normalBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(VERTEX_NORMALS),
    GL.STATIC_DRAW);

      

    return {
        position: positionBuffer,
        indices: indexBuffer,
        textureCoordinates:  textureCoordinatesBuffer,
        normal: normalBuffer
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

function updateVariables(){
    if (magnification_increase) {
        magnification += 0.1;
    }

    if (magnification_decrease) {
        magnification -= 0.1;
    }

    if (pitch_increase) {
        pitch += 0.1;
    }

    if (pitch_decrease) {
        pitch -= 0.1;
    }

    if (roll_increase) {
        roll += 0.1;
    }

    if (roll_decrease) {
        roll -= 0.1;
    }

    if (yaw_increase) {
        yaw += 0.1;
    }

    if (yaw_decrease) {
        yaw -= 0.1;
    }
}

function drawScene() {
    GL.canvas.height = window.innerHeight;
    GL.canvas.width = window.innerWidth;
    updateVariables();
    GL.viewport(0, 0, GL.canvas.width, GL.canvas.height)
    GL.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    GL.clearDepth(1.0);                 // Clear everything
    GL.enable(GL.DEPTH_TEST);           // Enable depth testing
    GL.depthFunc(GL.LEQUAL);            // Near things obscure far things
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, GL.canvas.width / GL.canvas.height, 0.1, 100.0);
    
    const modelViewMatrix = mat4.create();
    const zoom = -6.0 + magnification;
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, zoom]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, yaw, [0, 1, 0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, roll, [0, 0, 1]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, pitch, [1, 0, 0]);

    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    GL.bindBuffer(GL.ARRAY_BUFFER, BUFFERS.position);
    GL.vertexAttribPointer(PROGRAM_INFO.attribLocations.vertexPosition, 3, GL.FLOAT, false, 0, 0);
    GL.enableVertexAttribArray(PROGRAM_INFO.attribLocations.vertexPosition);
    
    GL.bindBuffer(GL.ARRAY_BUFFER, BUFFERS.textureCoordinates);
    GL.vertexAttribPointer(PROGRAM_INFO.attribLocations.textureCoordinates, 2, GL.FLOAT, false, 0, 0);
    GL.enableVertexAttribArray(PROGRAM_INFO.attribLocations.textureCoordinates);
    
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, BUFFERS.indices);

    GL.bindBuffer(GL.ARRAY_BUFFER, BUFFERS.normal);
    GL.vertexAttribPointer(PROGRAM_INFO.attribLocations.vertexNormal, 3, GL.FLOAT, false, 0, 0);
    GL.enableVertexAttribArray(PROGRAM_INFO.attribLocations.vertexNormal);

    GL.useProgram(PROGRAM_INFO.program);

    GL.activeTexture(GL.TEXTURE0);
    GL.bindTexture(GL.TEXTURE_2D, TEXTURE);
    GL.uniform1i(PROGRAM_INFO.uniformLocations.uSampler, 0);

    GL.uniformMatrix4fv(PROGRAM_INFO.uniformLocations.projectionMatrix, false, projectionMatrix);
    GL.uniformMatrix4fv(PROGRAM_INFO.uniformLocations.modelViewMatrix, false, modelViewMatrix);
    GL.uniformMatrix4fv(PROGRAM_INFO.uniformLocations.normalMatrix, false, normalMatrix);

    GL.drawElements(GL.TRIANGLES, 36, GL.UNSIGNED_SHORT, 0);
}

function handleInput(key, active) {
    switch (key) {
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

window.addEventListener("keydown", (e) => {
    handleInput(e.key, true);
})



window.addEventListener("keyup", (e) => {
    handleInput(e.key, false);
})