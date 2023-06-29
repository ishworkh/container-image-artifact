# Container Image Artifact

Module providing functionalities for uploading and downloading container image(s) in github action workflows. It leverages github artifact in the background to store uploaded images.

Images can be uploaded and downloaded with multiple container engines, and currently supported container engines are `docker` and `podman`.

Following functions are exported from the module,

## getUploader

Gives image uploader function which can be used to upload image as a github artifact to the current workflow run.

```javascript
const artifactUploader = createArtifactUploader();

// "docker" as container engine
getUploader(artifactUploader)(image, retentionDays = 0);

// "podman" as container engine
getUploader(artifactUploader, "podman")(image, retentionDays = 0);
```

## getDownloader

Gives image downloader function which can be used to download images.

```javascript
const artifactDownloader = createArtifactDownloader();

// "docker" as container engine
getDownloader(artifactDownloader)(image);

// "podman" as container engine
getDownloader(artifactDownloader, "podman")(image);
```

## createArtifactUploader

Function that creates core action artifact uploader. This uploader uses [`@actions/artifact`](https://github.com/actions/toolkit/tree/master/packages/artifact) module underneath.

```javascript
const uploader = createArtifactUploader();
```

## createArtifactDownloader

Function that creates core action artifact downloader. This downloader uses [`@actions/artifact`](https://github.com/actions/toolkit/tree/master/packages/artifact) module underneath and is capable of downloading artifacts from the same workflow.

```javascript
const downloader = createArtifactDownloader();
```

## createOctokitArtifactDownloader

Function that creates octokit artifact downloader. This downloader uses [`octokit`](https://github.com/octokit/action.js/) module underneath. This downloader is capable of downloading artifacts from another workflow.

```javascript
const downloader = createOctokitArtifactDownloader(
  "github_token", "foo_owner", "bar_repo", "Test workflow", (workflowRun) => workflowRun.id == 12434344
);
```
