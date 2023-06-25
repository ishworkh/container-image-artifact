const { exec } = require('child_process');
const { existsSync } = require('fs');

class ContainerEngine {
  async loadImage(inputPath) {
    if (!existsSync(inputPath)) {
      throw new Error(`Docker load image failed - image input path does not exist: ${inputPath}`);
    }

    return await new Promise((resolve, reject) => {
      exec(this._engineImageLoadCommand(inputPath), (err, _, stdErr) => {
        let error = err || stdErr;
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async packageImage(imageName, outputPath) {
    return await new Promise((resolve, reject) => {
      exec(this._enginePackageImageCommand(imageName, outputPath), (err, _, stdErr) => {
        let error = err || stdErr;
        if (error) {
          reject(error);
        } else {
          resolve(outputPath);
        }
      });
    });
  }

  _engineImageLoadCommand(inputPath) {
    throw new Error(`_engineImageLoad method not implemented.`);
  }

  _enginePackageImageCommand(imageName, outputPath) {
    throw new Error(`_enginePackageImage method not implemented.`);
  }
}

class DockerContainerEngine extends ContainerEngine {
  _engineImageLoadCommand(inputPath) {
    return `docker load -i ${inputPath}`;
  }

  _enginePackageImageCommand(imageName, outputPath) {
    return `docker save ${imageName} -o ${outputPath}`
  }
}

class PodmanContainerEngine extends ContainerEngine {
  _engineImageLoadCommand(inputPath) {
    return `podman load -i ${inputPath}`;
  }

  _enginePackageImageCommand(imageName, outputPath) {
    return `podman save ${imageName} -o ${outputPath}`
  }
}

exports.createDockerContainerEngine = () => new DockerContainerEngine();
exports.createPodmanContainerEngine = () => new PodmanContainerEngine();
