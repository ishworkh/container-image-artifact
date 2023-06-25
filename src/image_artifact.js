const path = require('path');
const os = require('os');
const { createDockerEngine, createPodmanEngine } = require("./container_engine");

const INVALID_CHARS = /[\s><:"|*?/\\]/g;

const resolvePackageName = (imageName) => imageName.replace(INVALID_CHARS, '_');

const resolveArtifactName = (imageName) => `action_image_artifact_${resolvePackageName(imageName)}`;

const getContainerEngine = (engine) => {
    switch (engine) {
        case "docker":
            return createDockerEngine();
        case "podman":
            return createPodmanEngine();
        default:
            throw new Error(`Container engine ${engine} is not supported.`);
    }
}

/**
 * @param {Object} artifactUploader 
 * @param {string} containerEngineName // Default to docker
 * 
 * @returns {Function} // async (string, int) =>  string i.e. Uploaded artifact name
 * 
 * Upload a image package as github artifact which is later possible to point to with given image name. 
 * Eg. image "foo:latest" is packaged to a file `foo_latest` and then upload as an artifact with a name 
 *      `image_artifact_foo_latest`. In short we will have an artifact like,
 *             image_artifact_foo_latest[foo_latest]
 */
exports.getUploader = function (artifactUploader, containerEngineName = "docker") {
    const containerEngine = getContainerEngine(containerEngineName);
    return async (image, retentionDays = 0) => {
        const packagePath = await containerEngine.packageImage(image, path.join(os.tmpdir(), resolvePackageName(image)));

        const artifactName = resolveArtifactName(image);
        await artifactUploader(artifactName, packagePath, retentionDays);

        return artifactName;
    }
}

/**
 * @param {Object} artifactDownloader
 * @param {string} containerEngineName // Defaults to docker
 * 
 * @returns {Function} // async (string) => string i.e.Artifact local downloaded path 
 * 
 * For a github artifact to be linked with the given image name, it has to be named in predictable way.
 * Eg. image `foo:latest` packaged as `foo_latest` uploaded as an artifact named `image_artifact_foo_latest`
 *      can be downloaded and loaded with ${downloadDir}/${packageName} i.e /tmp/foo_latest
 */
exports.getDownloader = function (artifactDownloader, containerEngineName = "docker") {
    const containerEngine = getContainerEngine(containerEngineName);
    return async (image) => {
        const downloadDir = await artifactDownloader(resolveArtifactName(image), os.tmpdir());

        const imagePackagePath = path.join(downloadDir, resolvePackageName(image));
        await containerEngine.loadImage(imagePackagePath);

        return imagePackagePath;
    }
}
