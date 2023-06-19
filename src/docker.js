const { exec } = require('child_process');
const { existsSync } = require('fs');

const dockerSaveCmd = (image, output) => `docker save ${image} -o ${output}`;

const dockerLoadCmd = (input) => `docker load -i ${input}`;

/**
 * 
 * @param {string} image 
 * @param {string} output 
 */
exports.packageImage = async function(image, output) {
    return await new Promise((resolve, reject) => {
        exec(dockerSaveCmd(image, output), (err, _, stdErr) => {
            error = err || stdErr;
            if (error) {
                reject(error);
            } else {
                resolve(output);
            }
        });
    });
}

/**
 * 
 * @param {string} input 
 */
exports.loadImage = async function(input) {
    if (!existsSync(input)){
        throw new Error(`Docker load image failed - image input path does not exist: ${input}`);
    }

    return await new Promise((resolve, reject) => {
        exec(dockerLoadCmd(input), (err, _, stdErr) => {
            error = err || stdErr;
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

const ALLOWED_ENGINES = ["docker", "podman"]

exports.create = (engine = "docker") => {
    if (!ALLOWED_ENGINES.includes(engine)) {
        throw new Error(`${engine} is not supported`);
    }

    
}
