# WireMD PNG

A simple project to transform [WireMD](https://github.com/akonan/wiremd) to PNGs.

## Run
- podman
  - `podman run -it -v $PWD:/data:Z wiremd-png:latest test/login.md > login.png`
- docker
  - `docker run -it -v $PWD:/data:Z wiremd-png:latest test/login.md > login.png`
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