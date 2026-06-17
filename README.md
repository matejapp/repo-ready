# RepoReady

RepoReady is a command-line tool that checks whether a developer's machine is ready to run a specific repository.

Instead of applying a generic system-health checklist, RepoReady reads a repository-owned `repoready.yml` file and validates the local environment against that project's actual requirements. It catches common setup problems—wrong Node.js versions, missing environment variables, unavailable tools, occupied ports, or a stopped Docker daemon—before they turn into a long debugging session.

It also detects setup drift. If `package.json`, `.nvmrc`, `.node-version`, `.env.example`, or the README no longer agrees with the setup contract, RepoReady reports the inconsistency and suggests what to update.

## Why RepoReady?

Project setup information tends to be scattered across several files:

- `package.json` declares one Node.js version.
- `.nvmrc` pins another.
- the README mentions an older requirement.
- `.env.example` contains variables that are missing from the onboarding instructions.
- a local service quietly occupies the port the application needs.

RepoReady turns those assumptions into an explicit, testable setup contract:

```bash
repoready scan
```

The result is a clear report showing what passed, what failed, what drifted, and how to fix it.

## Features

- Validates the installed Node.js version against a semver range.
- Checks that the expected package manager is available.
- Verifies required environment variables without printing their values.
- Confirms required system binaries are available on `PATH`.
- Tests whether required ports are free.
- Checks whether the Docker daemon is running.
- Validates PostgreSQL, MySQL, MongoDB, and Redis URL formats.
- Detects drift across `repoready.yml`, `package.json`, `.nvmrc`, `.node-version`, `.env.example`, and README setup hints.
- Produces readable terminal output with practical fix suggestions.
- Supports clean JSON output for scripts and CI pipelines.
- Uses stable exit codes for automation.
- Runs system diagnostics through a small, standard-library-only Python engine.

## Requirements

- Node.js 20 or newer
- Python 3.11 or newer, available as `python3`
- pnpm 10 or newer when developing RepoReady from source

RepoReady currently targets Unix-like environments such as Linux and macOS.

## Installation

### Install from source

Clone the repository, install dependencies, build the CLI, and link it globally:

```bash
git clone https://github.com/matejapp/repo-ready.git
cd repo-ready
pnpm install
pnpm build
pnpm link --global
```

The `repoready` command should now be available:

```bash
repoready --help
```

You can also run the compiled CLI without linking it:

```bash
node dist/cli/index.js --help
```

### Install from npm

Once the package is published, it can be installed globally with:

```bash
npm install --global repo-ready
```

The npm package is named `repo-ready`; the installed executable is `repoready`.

## Quick start

From the root of the project you want to validate, generate a starter contract:

```bash
repoready init
```

RepoReady creates `repoready.yml`, detects the project name, and uses the Node.js requirement from `package.json` or `.nvmrc` when available.

Edit the generated file to describe the project, then run:

```bash
repoready scan
```

To use a contract stored elsewhere:

```bash
repoready scan --config ./config/repoready.yml
```

For machine-readable output:

```bash
repoready scan --json
```

To see the available check types without running a scan:

```bash
repoready checks
```

## Configuration

RepoReady is configured through `repoready.yml`:

```yaml
project:
  name: "example-api"
  description: "Example Node.js API"

runtime:
  node: ">=20"
  packageManager: "pnpm"

env:
  files:
    - ".env"
    - ".env.local"
  exampleFile: ".env.example"
  required:
    - DATABASE_URL
    - JWT_SECRET

ports:
  required:
    - 3000
    - 5432

services:
  docker:
    required: true

binaries:
  required:
    - git
    - node
    - python3

database:
  urlEnv: DATABASE_URL
  type: postgres

metadata:
  compare:
    packageJson: true
    nvmrc: true
    nodeVersionFile: true
    envExample: true
    readme: false

commands:
  install: "pnpm install"
  dev: "pnpm dev"
```

All sections except `project` are optional. Checks only run when their corresponding requirements are configured.

### Environment files

Files listed under `env.files` are loaded in order. Later files override values from earlier files, and variables already present in the process environment take final precedence.

For safety, configured files must remain inside the project directory. RepoReady never includes environment-variable values in reports.

### Metadata comparison

Drift checks are enabled by default for:

- `package.json`
- `.nvmrc`
- `.node-version`
- `.env.example`

README comparison is disabled by default because version extraction from prose is necessarily best-effort.

## Output and exit codes

Terminal reports group results by category and include a summary and numbered fix suggestions. A result can be:

- `passed` — the requirement is satisfied
- `failed` — the machine does not satisfy the requirement
- `warning` — setup metadata is inconsistent
- `skipped` — the check lacks enough information to run

RepoReady uses the following exit codes:

| Code | Meaning                                          |
| ---: | ------------------------------------------------ |
|  `0` | All configured checks passed                     |
|  `1` | One or more checks failed                        |
|  `2` | The configuration is invalid                     |
|  `3` | An internal or Python diagnostics error occurred |

Warnings do not fail a scan.

### JSON output

`repoready scan --json` writes only JSON to standard output:

```json
{
  "project": "example-api",
  "timestamp": "2026-06-18T12:00:00.000Z",
  "summary": {
    "passed": 5,
    "failed": 1,
    "warnings": 2,
    "skipped": 0
  },
  "exitCode": 1,
  "checks": []
}
```

This makes RepoReady suitable for CI jobs, onboarding scripts, and other automation.

## Architecture

RepoReady deliberately separates user-facing work from operating-system diagnostics:

```text
repoready.yml
      |
      v
TypeScript CLI
  |-- configuration validation
  |-- Node.js, environment, package-manager, and binary checks
  |-- setup-drift analysis
  |-- terminal and JSON reporting
  |
  `-- Python subprocess
        |-- port availability
        |-- Docker status
        `-- database URL validation
```

The TypeScript and Python layers exchange a small JSON result model. Python writes diagnostics as JSON to standard output; operational messages stay on standard error so JSON mode remains safe to parse.

## Using RepoReady in CI

Add a setup contract to the repository and run the JSON scan as part of a job:

```yaml
- name: Validate repository setup contract
  run: repoready scan --json
```

The process exit code can be used directly to pass or fail the job.

This repository's own GitHub Actions workflow runs TypeScript checks across Node.js 20 and 22, and Python tests across Python 3.11 and 3.12.

## Development

Install the project dependencies:

```bash
pnpm install
```

Run the CLI directly from TypeScript:

```bash
pnpm dev scan
```

Build and validate the project:

```bash
pnpm build
pnpm lint
pnpm test
```

Run the Python test suite:

```bash
python3 -m pip install -r requirements-dev.txt
pnpm test:python
```

Before opening a pull request, please make sure both the TypeScript and Python test suites pass and avoid committing local environment files or credentials.

## Project status

RepoReady is currently at version `0.1.0`. The core setup contract, diagnostics, drift detection, terminal reporting, JSON reporting, tests, and CI workflow are implemented. The public interface may still evolve before a stable `1.0.0` release.

## License

RepoReady is available under the [MIT License](LICENSE).
