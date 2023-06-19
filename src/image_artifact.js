const docker = require('./docker');

const path = require('path');
const os = require('os');

const INVALID_CHARS = /[\s><:"|*?/\\]/g;

const resolvePackageName = (imageName) => imageName.replace(INVALID_CHARS, '_');

const resolveArtifactName = (imageName) => `action_image_artifact_${resolvePackageName(imageName)}`;

/**
 * @param {string} image 
 * @param {Object} artifactUploader
 * @param {number} retentionDays
 * 
 * @returns {string} // Uploaded artifact name
 * 
 * Upload a image package as github artifact which is later possible to point to with given image name. 
 * Eg. image "foo:latest" is packaged to a file `foo_latest` and then upload as an artifact with a name 
 *      `image_artifact_foo_latest`. In short we will have an artifact like,
 *             image_artifact_foo_latest[foo_latest]
 */
exports.upload = async function (image, artifactUploader, retentionDays = 0) {
    const packagePath = await docker.packageImage(image, path.join(os.tmpdir(), resolvePackageName(image)));

    const artifactName = resolveArtifactName(image);
    await artifactUploader(artifactName, packagePath, retentionDays);

    return artifactName;
}

/**
 * @param {string} image  
 * @param {Object} artifactDownloader // Defaults to core artifact downloader
 * 
 * @returns {string} // Artifact local downloaded path 
 * 
 * For a github artifact to be linked with the given image name, it has to be named in predictable way.
 * Eg. image `foo:latest` packaged as `foo_latest` uploaded as an artifact named `image_artifact_foo_latest`
 *      can be downloaded and loaded with ${downloadDir}/${packageName} i.e /tmp/foo_latest
 */
exports.download = async function (image, artifactDownloader) {
    const downloadDir = await artifactDownloader(resolveArtifactName(image), os.tmpdir());

    const imagePackagePath = path.join(downloadDir, resolvePackageName(image));
    await docker.loadImage(imagePackagePath);

    return imagePackagePath;
}
