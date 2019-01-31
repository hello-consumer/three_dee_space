let dependencies ={
    fragmentShaderSource: null,
    vertexShaderSource: null,
    shape: null,
    indices: null,
    textureCoordinates: null,
    vertexNormals: null,
    textureFilename: null
}

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

function loadDependencies()
{
    fetch('source.fragment').then(r => r.text().then(d => {
        dependencies.fragmentShaderSource = d;
    }));
    
    fetch('source.vertex').then(r => r.text().then(d => {
        dependencies.vertexShaderSource = d;
    }));
    
    fetch('model.json').then(response =>{
        response.json().then(model => {
            dependencies.shape = model.shape;
            dependencies.indices = model.indices;
            dependencies.textureCoordinates = model.textureCoordinates;
            dependencies.vertexNormals = model.vertexNormals;
            dependencies.textureFilename = model.textureFilename;
        })
    });

    if((dependencies.vertexShaderSource == null) 
        || (dependencies.fragmentShaderSource == null) 
        || (dependencies.shape == null)){
            window.setTimeout(loadDependencies, 1000);
        }
    else{
        runProgram();
    }
}

loadDependencies();

function runProgram(){
    const gl = document.querySelector('canvas').getContext('webgl')

    const shaderProgram = (() => {
        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, dependencies.vertexShaderSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, dependencies.fragmentShaderSource);
        const shaderProgram = gl.createProgram();

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        // If creating the shader program failed, alert

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        return shaderProgram;
    })();

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
            textureCoordinates: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
        },
    };
    const texture = (() => {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        //Placeholder pixel image while texture resourse loads
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
            gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

        const image = new Image();
        image.crossOrigin = "anonymous";
        image.addEventListener("load",(e) => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
        });
        image.src = dependencies.textureFilename;

        return texture;
    })();

    const buffers = (() => {
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dependencies.shape), gl.STATIC_DRAW);

        const textureCoordinatesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordinatesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dependencies.textureCoordinates), gl.STATIC_DRAW);
    
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(dependencies.indices), gl.STATIC_DRAW);


        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dependencies.vertexNormals),gl.STATIC_DRAW);

        return {
            position: positionBuffer,
            indices: indexBuffer,
            textureCoordinates:  textureCoordinatesBuffer,
            normal: normalBuffer
        };
    })();

    window.addEventListener('resize', () => drawScene(gl, programInfo, buffers, texture), false);
    drawScene(gl, programInfo, buffers, texture);
    window.setInterval(() => drawScene(gl, programInfo, buffers, texture), 20);
    window.addEventListener("keydown", (e) => { handleInput(e.key, true);})
    window.addEventListener("keyup", (e) => { handleInput(e.key, false);})
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

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

function drawScene(GL, PROGRAM_INFO, BUFFERS, TEXTURE) {
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