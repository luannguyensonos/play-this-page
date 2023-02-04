
chrome.runtime.onMessage.addListener( function ( message, sender, sendResponse ) {
  if ( message ) {
    switch ( message.type ) {
      case 'oktaCall':
        fetch( 'https://oauth.test.ws.sonos.com/oauth/v4/okta-widget/token', {
          method: "POST",
          Origin: 'test',
          headers: {
            'Authorization': 'Basic ZjU3ZDcxZTktMjQ2Mi00NTkzLTlhYzMtNzdjNDkyOThiNTU2OjZlODY4OGM0LTYyNzEtNDk1NC1iYjM1LWViZGI0NzNlNDY2ZA==',
            "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
          body: `username=${ message.email }&password=${ message.password }&grant_type=password&scope=identity-write-creds%20identity-read-basic%20playback-control-all`
        } )
          .then( ( res ) => res.json() ).then( ( res ) => {
            console.log( res, 'res' )
            sendResponse( res );
          } )
          .catch( ( e ) => {
            sendResponse( "ERROR" );
          } )
        break
    }

  }
  return true
} );
