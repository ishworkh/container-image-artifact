const artifact = require('@actions/artifact');
const github = require('@actions/github');

const admzip = require('adm-zip');
const path = require('path');
const fs = require('fs');

/* 
Github Core Artifact - @actions/artifact
*/

var artifactClient;

function getArtifactClient() {
    artifactClient = artifactClient || artifact.create();

    return artifactClient;
}

/* Github Octokit - @actions/github */

var octokitClient;

/**
 * @param {string} token
 */
function getOctokitClient(token) {
    octokitClient = octokitClient || github.getOctokit(token);

    return octokitClient;
}

/**
 * @param {Object} octokit
 * @param {string} owner 
 * @param {string} repo
 * @param {string} workflow
 * 
 * @returns [Object]
 * 
 * Ref Check https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#list-workflow-runs-for-a-repository
 */
async function fetchWorkflowRuns(octokit, owner, repo, workflow) {
    const { data: workflowRuns } = await octokit.rest.actions.listWorkflowRunsForRepo({ owner, repo });
    return workflowRuns.workflow_runs
        .filter(workflowRun => workflowRun.name == workflow.trim());
}

/**
 * @param {Object} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {number} runId
 * 
 * @returns [Object]
 * 
 * Ref https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28#list-artifacts-for-a-repository
 */
async function fetchArtifacts(octokit, owner, repo, runId) {
    const { data: { artifacts } } = await octokit.rest.actions.listWorkflowRunArtifacts({
        owner, repo, run_id: runId
    });

    return artifacts;
}

/** 
 * @param {Object} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {string} artifactId
 * 
 * @returns Buffer
 */
async function downloadArtifact(octokit, owner, repo, artifactId) {
    const artifact = await octokit.rest.actions.downloadArtifact({
        owner, repo, artifact_id: artifactId, archive_format: "zip"
    });

    return Buffer.from(artifact.data);
}

// Exports
/**
 * @returns {Function} // (name, basedir) => string
 */
exports.createArtifactDownloader = () => {
    return async function (name, basedir) {
        if (!fs.existsSync(basedir)) {
            throw new Error(`Artifact Download failed: ${name} - Directory does not exist: ${basedir}`);
        }
        const downloadResponse = await getArtifactClient().downloadArtifact(name, basedir);

        return downloadResponse.downloadPath;
    }
}

/**
 * @param {string} token 
 * @param {string} owner 
 * @param {string} repo 
 * @param {string} workflow 
 * @param {Function} filterCallback // (workflowRun) => bool
 * 
 * @returns {Function} // (name, basedir) => string
 */
exports.createOctokitArtifactDownloader = function (token, owner, repo, workflow, filterCallback = null) {
    const octokit = getOctokitClient(token);

    if (filterCallback == null) {
        filterCallback = () => true
    }
    return async function (name, basedir) {
        const workflowRuns = await fetchWorkflowRuns(octokit, owner, repo, workflow);
        const workflowRunIds = workflowRuns
            .filter(filterCallback)
            .map((workflowRun) => workflowRun.id);

        if (workflowRunIds.length == 0) {
            throw new Error(`No workflow runs for ${workflow} found with provided filter`);
        }

        const artifacts = await fetchArtifacts(octokit, owner, repo, workflowRunIds[0]);

        const matchingArtifacts = artifacts.filter(artifact => artifact.name == name.trim());
        if (matchingArtifacts.length == 0) {
            throw new Error(`No artifact: ${name} found for: ${workflow} in the run ${workflowRunIds[0]}`);
        }

        const artifact = await downloadArtifact(octokit, owner, repo, matchingArtifacts[0].id);
        if (!fs.existsSync(basedir)) {
            throw new Error(`Artifact Download failed: ${name} - Directory does not exist: ${basedir}`);
        }

        const baseName = path.join(basedir, name);
        fs.writeFileSync(`${baseName}.zip`, artifact, 'binary');

        const extractDir = baseName;
        (new admzip(`${baseName}.zip`))
            .extractAllTo(baseName);

        return extractDir;
    }
}

/**
 * @returns Function // (name, file, retentionDays)
 */
exports.createArtifactUploader = () => {
    return async function (name, file, retentionDays = 0) {
        if (!fs.existsSync(file)) {
            throw new Error(`Artifact Upload failed: ${name} - File does not exist: ${file}`);
        }

        const uploadResponse = await getArtifactClient().uploadArtifact(
            name, [file], path.dirname(file), { retentionDays: retentionDays }
        );

        // there is a failed item
        if (uploadResponse.failedItems.length > 0) {
            throw new Error(`Artifact Upload failed: ${name}`);
        }

        return name;
    }
}
