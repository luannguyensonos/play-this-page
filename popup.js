// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


const $loginButton = document.getElementById("loginButton");
const $logoutButton = document.getElementById("logoutButton");

const $loginForm = document.getElementById("loginForm");
const $loggingIn = document.getElementById("loggingIn");
const $loggedIn = document.getElementById("loggedIn");
const $parseResults = document.getElementById("parseResults");
const $householdResults = document.getElementById("householdResults");
const $householdFieldset = document.getElementById("householdFieldset");
const $playWrapper = document.getElementById("playWrapper");
const $debug = document.getElementById("debug");

let myAccessToken;

const doActions = (email, token) => {
  $debug.innerText = '';
  myAccessToken = token;
  $loginForm.classList.add("hide");
  $loggingIn.classList.add("hide");
  $loggedIn.classList.remove("hide");
  document.getElementById("loggedInAs").innerText = email

  // Do stuff
  parsePage();
  buildHousehold();
}

const parsePage = () => {
  $parseResults.classList.remove("hide");
  // Do parsing logic on the page here...
  // $parseResults.innerHTML = 'RESULTS HERE'
}

const fetchHousehold = () => {
  if (myAccessToken) {
    chrome.runtime.sendMessage({
      token: myAccessToken,
      type: "fetchHousehold",
    }, (res) => {
      if (!res || res === "ERROR") {
        $householdResults.classList.add("hide");
        $debug.innerText = 'Could not locate your SONOS system!'
      } else if (res) {
        const hhid = res.households[0].id
        chrome.runtime.sendMessage({
          hhid,
          token: myAccessToken,
          type: "fetchGroups",
        }, (res) => {
          if (!res || res === "ERROR") {
            $householdResults.classList.add("hide");
            $debug.innerText = 'Could not locate your SONOS system!'
          } else if (res) {
            const groups = res.groups
            chrome.storage.local.set({
              'groups': groups
            }, () => {
              buildHousehold()
            })
          }
        })
      }
    })
  }
}

const buildHousehold = () => {
  chrome.storage.local.get(['groups'], (result) => {
    if (result) {
      if (result.groups) {
        $householdResults.classList.remove("hide");
        // Build out list using groups
        result.groups.forEach((group) => {
          const g = group.name;
          const gid = group.id;
          const newGroup = document.createElement("div");
          const newInput = document.createElement("input");
          const newLabel = document.createElement("label");
          newInput.type = 'radio';
          newInput.id = g;
          newInput.name = g;
          newInput.value = gid;
          newLabel.setAttribute('for', g);
          newLabel.innerText = g;
          newGroup.appendChild(newInput);
          newGroup.appendChild(newLabel);
          $householdFieldset.appendChild(newGroup)
        })
        $playWrapper.classList.remove("hide");
      } else {
        fetchHousehold();
      }
    }
  })
}

const initialize = () => {
  chrome.storage.local.get(['email', 'accessToken'], (result) => {
    if (result) {
      if (result.email && result.accessToken) {
        doActions(result.email, result.accessToken);
      } else {
        $loginForm.classList.remove("hide");
        $loggedIn.classList.add("hide");
        $parseResults.classList.add("hide");
        $householdResults.classList.add("hide");
        $playWrapper.classList.add("hide");
      }
    }
  })
}

initialize()

$loginButton.addEventListener("click", () => {
  $loginForm.classList.add("hide");
  $loggingIn.classList.remove("hide");
  const email = document.getElementById("inputEmail").value
  const password = document.getElementById("inputPassword").value

  chrome.runtime.sendMessage({
    email,
    password,
    type: "oktaCall",
  }, (res) => {
    if (!res || res === "ERROR") {
      $loginForm.classList.remove("hide");
      $loggingIn.classList.add("hide");
      $debug.innerText = 'Log in failed. Try again later.'
    } else if (res) {
      const accessToken = res.access_token
      chrome.storage.local.set({
        'email': email,
        'accessToken': accessToken
      })
      doActions(email, accessToken)
    }
  })
});

$logoutButton.addEventListener("click", () => {
  chrome.storage.local.set({
    'email': '',
    'accessToken': '',
    'groups': ''
  }, () => {
    $debug.innerText = 'Successfully logged out'
  })
  document.getElementById("inputEmail").value = ''
  document.getElementById("inputPassword").value = ''
  initialize()
});
