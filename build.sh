export PATH=$NODEJS_12_18_3_BIN:$YARN_1_22_4_BIN:$PATH

echo "node: $(node -v)"
echo "npm: ${npm -v}"

# 构建输出目录
mkdir "output"

env="test"
if [ "${1}" == "prod" ]; then
  env="prod"
fi

npm install
npm run build:${env}

# copy到目标目录
cp -r dist/ output/
