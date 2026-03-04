# WireMD PNG

A simple project to transform [WireMD](https://github.com/akonan/wiremd) to PNGs.

## Run using the pre-built image
- podman
  - `podman run --rm -v $PWD:/data:Z docker.io/mauricemueller/wiremd-png:latest --style sketch /data/test/login.md > login.png`
- docker
  - `docker run --rm -v $PWD:/data:Z mauricemueller/wiremd-png:latest --style sketch /data/test/login.md > login.png`
- adapt the defaults by adding the following flags
  - --style clean|sketch|wireframe|tailwind|material|brutal
    - by default, it is 'sketch'
  - --width 1200
    - by default, it is '0' which is equal to 'auto'
  - --height 600
    - by default, it is '0' which is equal to 'auto'

## Build locally

- clone the repo
- run the corresponding build script (podman/docker)

### Run the local image
- podman
  - `podman run --rm -v $PWD:/data:Z wiremd-png:latest --style sketch /data/test/login.md > login.png`
- docker
  - `docker run --rm -v $PWD:/data:Z wiremd-png:latest --style sketch /data/test/login.md > login.png`

## Dev

### Build and push

Build and Push with GitHub Action

  - Go to GitHub Actions
  - Select Build and Push docker image
  - Click Run workflow
  - Select the branch with the Dockerfile to use
  - Insert the tag you want the new image to have
  - Start workflow

The action automatically builds the current image and pushes it to docker.io/mauricemueller/wiremd-png with the specified tag as well as the tag latest.