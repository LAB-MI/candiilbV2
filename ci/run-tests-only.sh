#!/bin/bash
basename=$(basename $0)
ret=1
docker images

# Set run test env
export FRONT_ADMIN_PORT=81
export DBDATA=../test-db
# Variables stack e2e
export PUBLIC_URL=http://candidat.candilib.local/candidat
export ADMIN_URL=http://admin.candilib.local/admin
export SMTP_SERVER=mailhog
export SMTP_PORT=1025
export CONTAINER_NAME_CANDIDAT=candidat.candilib.local
export CONTAINER_NAME_ADMIN=admin.candilib.local
export LC_ALL=fr_FR.UTF-8

ret=1
echo "# run all separated services (front_candidat,front_admin,api,db) in prod mode"
time make up-all
ret=$?
if [ "$ret" -gt 0 ] ; then
  echo "$basename up-all ERROR"
  exit $ret
fi
docker ps

ret=1
echo "# test all services up&running"
time make test-all
ret=$?
if [ "$ret" -gt 0 ] ; then
  echo "$basename test-all ERROR"
  exit $ret
fi

# To disable tests, set DISABLE_E2E_TESTS to true
if [ -z "$DISABLE_E2E_TESTS" ] ; then
ret=1
echo "# init db for e2e tests"
time make init-db-e2e
ret=$?
if [ "$ret" -gt 0 ] ; then
  echo "$basename init-db-e2e ERROR"
  exit $ret
fi

# ret=1
# echo "# build e2e images"
# time make build-e2e
# ret=$?
# if [ "$ret" -gt 0 ] ; then
#   echo "$basename build-e2e ERROR"
#   exit $ret
# fi

ret=1
echo "# e2e tests"
time make up-e2e CYPRESS_ARG="--spec tests/e2e/specs/$1"
ret=$?
if [ "$ret" -gt 0 ] ; then
  echo "$basename up-e2e ERROR"
  exit $ret
fi

ret=1
echo "# remove e2e container"
time make down-e2e
ret=$?
if [ "$ret" -gt 0 ] ; then
  echo "$basename down-e2e ERROR"
  exit $ret
fi
fi

ret=1
echo "# remove all services"
time make down-all
ret=$?
if [ "$ret" -gt 0 ] ; then
  echo "$basename down-all ERROR"
  exit $ret
fi

exit $ret
