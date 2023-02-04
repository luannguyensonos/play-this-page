
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
          body: `username=${ encodeURIComponent(message.email) }&password=${ encodeURIComponent(message.password) }&grant_type=password&scope=identity-write-creds%20identity-read-basic%20playback-control-all`
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
            'Authorization': `Bearer ${message.token}`,
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
        fetch( `https://api.ws.sonos.com/control/api/v1/households/${message.hhid}/groups:1/`, {
          method: "GET",
          Origin: 'test',
          headers: {
            'Authorization': `Bearer ${message.token}`,
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
    }

  }
  return true
} );
