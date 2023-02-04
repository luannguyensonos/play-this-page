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
const $debug = document.getElementById("debug");

const showLoggedIn = (email, token) => {
  $loginForm.classList.add("hide");
  $loggingIn.classList.add("hide");
  $loggedIn.classList.remove("hide");
  document.getElementById("loggedInAs").innerText = email
  document.getElementById("accessToken").innerText = token
}

const initialize = () => {
  chrome.storage.local.get(['email', 'accessToken'], (result) => {
    if (result) {
      if (result.email && result.accessToken) {
        showLoggedIn(result.email, result.accessToken)
      } else {
        $loginForm.classList.remove("hide");
        $loggedIn.classList.add("hide");
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
      $debug.innerText = 'FAILED TO LOG IN'
    } else if (res) {
      $debug.innerText = 'Fetch result: ' + JSON.stringify(res)
      const accessToken = res.access_token
      chrome.storage.local.set({
        'email': email,
        'accessToken': accessToken
      }, () => {})
      showLoggedIn(email, accessToken)
    }
  })
});

$logoutButton.addEventListener("click", () => {
  chrome.storage.local.set({
    'email': '',
    'accessToken': ''
  }, () => {
    $debug.innerText = 'LOGGED OUT'
  })
  document.getElementById("inputEmail").value = ''
  document.getElementById("inputPassword").value = ''
  $loginForm.classList.remove("hide");
  $loggedIn.classList.add("hide");
});
