#!/bin/bash
pushd dist/tooling
schematics .:ng-add $*
popd
