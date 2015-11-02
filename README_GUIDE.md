# Run tests in Badger

In this guide you get to know more about user interface and about running tests by the example of <a href="https://github.com/2gis/badger-api">badger-api</a>.

### API tests

Create testplan "Badger API":
```bash
Project->Testplans->Add new
```
Describe launch items:
```bash
Launch items->Add new launch item
```
 - Deploy script - clone repository:
```bash
git clone https://github.com/2gis/badger-api.git
```
 - Regular script - run tests:
```bash
export PATH=$PATH
cd badger-api
tox
```
 - Conclusive script - report results:
*For reports you need user's login and password. Ex. test:test*
```bash
XMLS="./badger-api/reports/*.xml"
for xml in $XMLS
do curl -X POST -F launch=$LAUNCH_ID -F file=@$xml http://test:test@localhost:8000/api/external/report-xunit/$TESTPLAN_ID/junit/$xml
done
```
Run tests:
```bash
Launch->Select all->Execute
```