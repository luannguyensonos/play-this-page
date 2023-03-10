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


const DEBUG = false
const DEMO_MODE = false

const $loginButton = document.getElementById( "loginButton" );
const $logoutButton = document.getElementById( "logoutButton" );

const $loginForm = document.getElementById( "loginForm" );
const $loggingIn = document.getElementById( "loggingIn" );
const $loggedIn = document.getElementById( "loggedIn" );
const $parseResults = document.getElementById( "parseResults" );
const $householdResults = document.getElementById( "householdResults" );
const $householdFieldset = document.getElementById( "householdFieldset" );
const $refreshGroups = document.getElementById( "refreshGroups" );
const $playWrapper = document.getElementById( "playWrapper" );
const $playButton = document.getElementById( "playButton" );
const $promptWrapper = document.getElementById( "promptWrapper" );
const $promptSubmit = document.getElementById( "promptSubmit" );
const $prompt = document.getElementById( "prompt" );
const $debug = document.getElementById( "debug" );

let myAccessToken;


const loadingStates = [
  "loading",
  "hang tight",
  "still thinking",
  "just a little longer",
  "almost there",
  "bear with me",
  "it'll be worth the wait",
  "this is going to work, I promise",
  "oh boy",
  "ok now I'm nervous",
  "fingers crossed",
  "please, please, please",
  "ok start praying",
  "oh come on already",
  "wanna hear a joke?",
  "maybe time to face the music",
  "get it? heh heh",
]


const doActions = ( email, token ) => {
  $debug.innerText = '';
  myAccessToken = token;
  $loginForm.classList.add( "hide" );
  $loggingIn.classList.add( "hide" );
  $loggedIn.classList.remove( "hide" );
  document.getElementById( "loggedInAs" ).innerText = email

  // Do stuff
  //showPrompt();
  doOpenAICall();
  buildHousehold();
}

const showPrompt = () => {
  $promptWrapper.classList.remove( "hide" )
}

const loader = (node, prefix, counter = 0) => {
  if ( node.innerText.startsWith( prefix ) ) {
    const cycle = counter / 15
    if (Number.isInteger(cycle)) {
      const msg = loadingStates[cycle % loadingStates.length]
      const start = node.innerText.indexOf('...') + 3
      node.innerText = `${node.innerText.substring(0, start)} ${msg}`
    } else {
      node.innerText += '.'  
    }
    setTimeout( () => { loader(node, prefix, counter+1) }, 100 )
  }
}

const doOpenAICall = ( promptOverride ) => {
  $parseResults.innerText = `OpenAI is creating your playlist...`
  loader($parseResults, 'OpenAI')
  $parseResults.classList.remove( "hide" )
  $promptSubmit.disabled = true
  $playButton.disabled = true
  chrome.tabs.query( { active: true, lastFocusedWindow: true }, tabs => {
    let prompt = promptOverride ? promptOverride : tabs && tabs[ 0 ] ? tabs[ 0 ].title : "songs that make you happy";
    $prompt.innerText = promptOverride ? promptOverride : `Don't like the playlist? Add a custom prompt to generate a new one...`
    chrome.runtime.sendMessage( {
      prompt: prompt,
      type: "fetchPlaylist",
    }, ( res ) => {
      if ( !res || res === "ERROR" ) {
        $parseResults.innerText = `Sorry, could not create a playlist. Try again with a different prompt.`
        showPrompt()
      } else if ( res ) {
        const list = document.createElement( 'div' )
        list.className = 'results'
        res.forEach( r => {
          const li = document.createElement( 'div' )
          const track = document.createElement('span')
          track.className = 'track'
          track.innerText = r.track
          const artist = document.createElement('span')
          artist.className = 'artist'
          artist.innerText = r.artist
          li.appendChild(track)
          li.appendChild(artist)
          list.appendChild( li )
        } )
        $parseResults.innerHTML = '';
        $parseResults.append( list )
        chrome.storage.local.set( {
          'playlist': res
        }, () => {
          $playButton.innerHTML = "Play"
          $playButton.disabled = false
          showPrompt()
        } )
      }
      $promptSubmit.disabled = false
    } )
  } )
  if ( DEBUG ) $debug.innerText = `parsePage ${ promptOverride } ${ Date.now() }`
}

const fetchHousehold = () => {
  if ( myAccessToken ) {
    $householdFieldset.innerHTML = 'Refreshing groups...';
    loader($householdFieldset, 'Refresh')
    chrome.runtime.sendMessage( {
      token: myAccessToken,
      type: "fetchHousehold",
    }, ( res ) => {
      if ( !res || res === "ERROR" ) {
        $householdResults.classList.add( "hide" );
        $debug.innerText = 'Could not locate your SONOS system!'
      } else if ( res ) {
        const hhid = res.households[ 0 ].id
        chrome.runtime.sendMessage( {
          hhid,
          token: myAccessToken,
          type: "fetchGroups",
        }, ( res ) => {
          if ( !res || res === "ERROR" ) {
            $householdResults.classList.add( "hide" );
            $debug.innerText = 'Could not locate your SONOS system!'
          } else if ( res ) {
            const groups = res.groups
            chrome.storage.local.set( {
              'groups': groups
            }, () => {
              buildHousehold()
            } )
          }
        } )
      }
    } )
  }
}

const buildHousehold = () => {
  chrome.storage.local.get( [ 'groups' ], ( result ) => {
    if ( result ) {
      if ( result.groups ) {
        $householdFieldset.innerHTML = '';
        const legend = document.createElement('legend');
        legend.innerText = 'Select a speaker group to play on:'
        $householdFieldset.appendChild(legend)
        $householdResults.classList.remove( "hide" );
        // Build out list using groups
        result.groups.forEach( ( group ) => {
          const g = group.name;
          const gid = group.id;
          const newGroup = document.createElement( "div" );
          const newInput = document.createElement( "input" );
          const newLabel = document.createElement( "label" );
          newInput.type = 'radio';
          newInput.id = g;
          newInput.name = 'groupToPlayOn';
          newInput.value = gid;
          newLabel.setAttribute( 'for', g );
          newLabel.innerText = g;
          newGroup.appendChild( newInput );
          newGroup.appendChild( newLabel );
          $householdFieldset.appendChild( newGroup )
        } )
        $playWrapper.classList.remove( "hide" );
      } else {
        fetchHousehold();
      }
    }
  } )
}

const initialize = () => {
  chrome.storage.local.get( [ 'email', 'accessToken' ], ( result ) => {
    if ( result ) {
      if ( result.email && result.accessToken ) {
        doActions( result.email, result.accessToken );
      } else {
        $loginForm.classList.remove( "hide" );
        $loggedIn.classList.add( "hide" );
        $parseResults.classList.add( "hide" );
        $promptWrapper.classList.add( "hide" );
        $householdResults.classList.add( "hide" );
        $playWrapper.classList.add( "hide" );
      }
    }
  } )
}

initialize()

const handleLoginFailure = ( msg ) => {
  $loginForm.classList.remove( "hide" );
  $loggingIn.classList.add( "hide" );
  $debug.innerText = `Log in failed: ${ msg }`
}

$loginButton.addEventListener( "click", () => {
  $loginForm.classList.add( "hide" );
  $loggingIn.classList.remove( "hide" );
  const email = document.getElementById( "inputEmail" ).value
  const password = document.getElementById( "inputPassword" ).value

  chrome.runtime.sendMessage( {
    email,
    password,
    type: "oktaCall",
  }, ( res ) => {
    if ( !res || res === "ERROR" ) {
      handleLoginFailure( 'Okta failed' )
    } else {
      const accessToken = res.access_token
      if ( accessToken ) {
        chrome.storage.local.set( {
          'email': email,
          'accessToken': accessToken
        } )
        doActions( email, accessToken )
      } else {
        handleLoginFailure( 'No access token' )
        $debug.innerText = `Log in failed: ${ JSON.stringify( res ) }`
      }
    }
  } )
} );

$logoutButton.addEventListener( "click", () => {
  chrome.storage.local.set( {
    'email': '',
    'accessToken': '',
    'groups': ''
  }, () => {
    $debug.innerText = 'Successfully logged out'
  } )
  document.getElementById( "inputEmail" ).value = ''
  document.getElementById( "inputPassword" ).value = ''
  initialize()
} );

const handlePlay = ( retryAttempt ) => {
  let groupId;
  document.getElementsByName( "groupToPlayOn" ).forEach( e => {
    if ( e.checked ) groupId = e.value
  } )
  if ( groupId ) {
    $debug.innerText = ''
    if (DEMO_MODE) {
      $playButton.innerHTML = "Find & Play is loading your playlist..."
      setTimeout(() => {
        $playButton.innerHTML = "Enjoy!"
      }, 750)
    } else {
      $playButton.innerHTML = retryAttempt ?
        "Thanks for your patience..." :
        "Find & Play is loading your playlist..."
      loader($playButton, retryAttempt ? 'Thanks' : 'Find')
    }
    $playButton.disabled = true
  
    if ( DEBUG ) $debug.innerText = `About to play to ${ groupId }`
    chrome.storage.local.get( [ 'playlist' ], ( result ) => {
      if ( result ) {
        if ( result.playlist && myAccessToken ) {
          chrome.runtime.sendMessage( {
            groupId,
            token: myAccessToken,
            playlist: result.playlist,
            type: "findAndPlay",
          }, ( res ) => {
            if ( !res || res === "ERROR" || res.errorCode ) {
              if (!DEMO_MODE) {
                if ( !retryAttempt ) {
                  // Give it one retry and F&P is a little finnicky
                  handlePlay( 1 )
                } else {
                  $playButton.innerHTML = "Play"
                  $debug.innerText = `Sorry! Something went wrong. Try again later.`
                  $playButton.disabled = false
                }
              }
            } else {
              $debug.innerText = ""
              $playButton.innerHTML = "Enjoy!"
            }
          } )
        } else {
          $debug.innerText = `Sorry! Something went wrong. Try again later.`
          $playButton.disabled = false
        }
      }
    } )
  } else {
    $debug.innerText = `Need to select a group to play to!`
    $playButton.disabled = false
  }
}

$playButton.addEventListener( "click", () => {
  handlePlay()
} );

$refreshGroups.addEventListener( "click", () => {
  fetchHousehold()
} );

$householdFieldset.addEventListener( "click", () => {
  $playButton.innerHTML = "Play"
  $playButton.disabled = false
} );

$promptSubmit.addEventListener( "click", () => {
  const prompt = $prompt.value
  console.log( 'Prompt submit', prompt )
  if ( prompt && prompt.length ) {
    doOpenAICall( prompt )
  }
} );
