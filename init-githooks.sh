cd .git/hooks

echo "#!/bin/bash\ncat \$1 | node_modules/.bin/commitlint" >commit-msg
chmod u+x commit-msg
