const { getUploader, getDownloader } = require("./image_artifact");
const { createArtifactDownloader, createOctokitArtifactDownloader, createArtifactUploader } = require("./github_artifact");

module.exports = {
  getUploader,
  getDownloader,

  // Github artifact downloaders - 2 types
  //  artifactDownloader - core action artifact downloader
  //  octokitArtifactDownloader - octokit artifact downloader. Exposes a factory method to create the downloader.
  createArtifactDownloader,
  createOctokitArtifactDownloader,

  // Github artifact uploader
  createArtifactUploader
}
