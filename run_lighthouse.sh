#!/bin/bash

npx webpack-dev-server --port 9000 &

npm install -g @lhci/cli@next

lhci collect --url=http://localhost:9000/

lhci assert --preset="lighthouse:recommended"

EXIT_CODE=$?
kill $!
exit $EXIT_CODE