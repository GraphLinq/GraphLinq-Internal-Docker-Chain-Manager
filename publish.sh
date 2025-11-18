version=v0.0.14
docker tag docker-glq-nodemanager:$version graphlinqchain/docker-glq-nodemanager:$version
docker push graphlinqchain/docker-glq-nodemanager:$version
docker tag docker-glq-nodemanager:$version graphlinqchain/docker-glq-nodemanager:latest
docker push graphlinqchain/docker-glq-nodemanager:latest