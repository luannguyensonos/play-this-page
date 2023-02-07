const gptKey = 'c2stTHJsTXZxSUdtQzdSeExISm9IaHlUM0JsYmtGSmg2TVQxNHA2MXdtUWZMcGdlUE8x'


chrome.runtime.onMessage.addListener( function ( message, sender, sendResponse ) {
  if ( message ) {
    switch ( message.type ) {
      case 'oktaCall':
        fetch( 'https://oauth.ws.sonos.com/oauth/v4/okta-widget/token', {
          method: "POST",
          Origin: 'test',
          headers: {
            'Authorization': 'Basic M2Y0OGUyNTktYTNkNi00MzM4LWE3NDktNDVkZGEzMDBiYjdlOjRkMzg5MDk2LWVhZDgtNGM0Ny05ZmI4LTExMzgyMGJkMzFhZA==',
            "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
          body: `username=${ encodeURIComponent( message.email ) }&password=${ encodeURIComponent( message.password ) }&grant_type=password&scope=identity-write-creds%20identity-read-basic%20playback-control-all`
        } )
          .then( ( res ) => res.json() ).then( ( res ) => {
            console.log( res, 'res' )
            sendResponse( res );
          } )
          .catch( ( e ) => {
            sendResponse( "ERROR" );
          } )
        break
      case 'fetchHousehold':
        fetch( 'https://api.ws.sonos.com/control/api/v1/households:1/', {
          method: "GET",
          Origin: 'test',
          headers: {
            'Authorization': `Bearer ${ message.token }`,
          }
        } )
          .then( ( res ) => res.json() ).then( ( res ) => {
            console.log( res, 'res' )
            sendResponse( res );
          } )
          .catch( ( e ) => {
            console.log( res, 'ERROR' )
            sendResponse( "ERROR" );
          } )
        break
      case 'fetchGroups':
        fetch( `https://api.ws.sonos.com/control/api/v1/households/${ message.hhid }/groups:1/`, {
          method: "GET",
          Origin: 'test',
          headers: {
            'Authorization': `Bearer ${ message.token }`,
          }
        } )
          .then( ( res ) => res.json() ).then( ( res ) => {
            console.log( res, 'res' )
            sendResponse( res );
          } )
          .catch( ( e ) => {
            console.log( res, 'ERROR' )
            sendResponse( "ERROR" );
          } )
        break
      case 'findAndPlay':
        const fnpbody = {
          "tracksMetadata": message.playlist,
          "playOnCompletion": true
        }
        console.log('FNP', message.groupId, fnpbody)
        fetch( `https://api.ws.sonos.com/control/api/v1/groups/${message.groupId}/find/tracksAndLoad`, {
          method: "POST",
          Origin: 'test',
          headers: {
            'Authorization': `Bearer ${ message.token }`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(fnpbody)
        } )
          .then( ( res ) => res.json() ).then( ( res ) => {
            console.log( res, 'res' )
            sendResponse( res );
          } )
          .catch( ( e ) => {
            console.log( res, 'ERROR' )
            sendResponse( "ERROR" );
          } )
        break
      case 'fetchPlaylist':

        const prompt = `Create 5 song playlist in a JSON format with {"artist": artistName, "track": trackName} based on ${ message.prompt }`
        const body = {
          model: 'text-davinci-003',
          prompt: prompt,
          max_tokens: 150,
          temperature: 0.75,
          n: 1
        }
        console.log( body, 'body' )
        fetch( `https://api.openai.com/v1/completions`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${atob(gptKey)}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify( body )
        } )
          .then( ( res ) => res.json() ).then( ( data ) => {
            if (data && data.choices) {
              const playlist = data.choices[ 0 ].text
              console.log( playlist, 'playlist' )
              const arrayStart = playlist.indexOf( '[' )
              const arrayEnd = playlist.indexOf( ']' ) ? playlist.indexOf( ']' )+1 : playlist.length
              let songArr = playlist.slice( arrayStart, arrayEnd )

              // These are to handle inconsistencies with the return object
              if (!songArr.indexOf( ']' )) songArr = `${songArr}]`
              songArr = songArr.replace(/\s/g, ' ')
              songArr = songArr.replace(/}\s*,\s*]/g, '}]')
              console.log( Array.isArray( songArr ), songArr )

              const playlistObj = JSON.parse(`{"playlist":${songArr}}`)
              if (playlistObj && playlistObj.playlist) {
                console.log('Parsed playlist', playlistObj.playlist)
                sendResponse( playlistObj.playlist )
              } else {
                sendResponse( "ERROR" )
              }
            } else {
              sendResponse( "ERROR" )
            }
          } )
          .catch( ( e ) => {
            console.log( e, 'ERRORe' )
            sendResponse( "ERROR" )
          } )
        break
    }

  }
  return true
} );
