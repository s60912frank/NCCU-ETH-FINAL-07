# NCCU-ETH-FINAL-07
Final project


## Backend folder 
first install node related library
```
npm install
```
Then open any Ethereum development tools,then 

```
node deploy.js
```

It will deploy to local Ethereum develop server,and set the `docs/GlobalSetting/address.txt`

---


## Metamask

Login will use web3.currentProvider to detect,suppose that you have already install a `Metamask` plugin in browser.

# Docs folder (frontend)

When develop,need boostrap and scss folder 

Use following command to watch

```
sass --watch scss/main.scss:css/main.css

```

#### (optional)
use live-server to develop

Ref:https://gist.github.com/donmccurdy/20fb112949324c92c5e8

Install

```
npm install -g live-server
```

In the folder you want to run,this project is under the `docs/`

```
live-server --no-browser --port=8380
```


## Github Page
Then you can open any browser in localhost:8380 to see the result,it will be the same as github page  
https://s60912frank.github.io/NCCU-ETH-FINAL-07/
