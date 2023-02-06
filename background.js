
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
      case 'fetchPlaylist':

        const prompt = `Create 5 song playlist in a JSON format with {artist: artistName, track: trackName} based on ${ message.prompt }`
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
            'Authorization': `Bearer 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`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify( body )
        } )
          .then( ( res ) => res.json() ).then( ( data ) => {
            const playlist = data.choices[ 0 ].text
            console.log( playlist, 'playlist' )
            const arrayStart = playlist.indexOf( '[' )
            const arrayEnd = playlist.indexOf( ']' ) + 1
            const songArr = playlist.slice( arrayStart, arrayEnd )
            console.log( Array.isArray( songArr ), 'songArr' )

            sendResponse( songArr )
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
