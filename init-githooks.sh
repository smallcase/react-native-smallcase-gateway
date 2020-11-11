cd .git/hooks

echo "#!/bin/bash\nexec < /dev/tty && node_modules/.bin/cz --hook || true" >prepare-commit-msg
chmod u+x prepare-commit-msg

echo "#!/bin/bash\ncat \$1 | node_modules/.bin/commitlint" >commit-msg
chmod u+x commit-msg
