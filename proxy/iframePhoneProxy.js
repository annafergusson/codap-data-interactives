/**
 * Sets up a proxy between a child IFrame (e.g. a data interactive (DI))
 * and a parent page (e.g. a CODAP instance) using
 * IFramePhone in both directions. Logs everything going and coming.
 *
 * When the child (DI) invokes iFramePhone.call, this is received by the proxy. The
 * proxy logs the call and calls CODAP passing its own callback. When the parent
 * invokes the proxy's callback, it logs the response and calls the child's callback.
 *
 *     DI ---> proxy ---> CODAP
 *      ^                   v
 *      +<----       <------+
 *
 * Likewise, when the parent frame, (e.g. CODAP) invokes iFramePhone.call,
 * this is received and propagated by the proxy.
 *
 *     DI <--- proxy <--- CODAP
 *      v                   ^
 *      +---->       ------>+
 */
function Proxy() {
  function Message(iMsg, iCallback, iDestination, id, direction) {
    return {
      call: function () {
        console.log('API Call ' + direction + ': (' + id + ') ' + JSON.stringify(iMsg));
        if (iDestination) {
          iDestination.call(iMsg, this.reply);
        } else {
          iCallback({success:false});
        }
      },
      reply: function (response) {
        console.log('API Reply ' + direction + ': (' + id + ') ' + JSON.stringify(response) );
        if (response) iCallback(response);
      }
    }
  }
  function origin() {
    return document.location.href.match(/(.*?\/\/.*?)\//)[1];
  }
  var parentEndpoint = null, childEndpoint = null, messages = [], msgCount = 0;

  if (window !== window.parent) {
    parentEndpoint = new iframePhone.IframePhoneRpcEndpoint( function (iMsg, iCallback) {
      iCallback && iCallback({success:false});
      /*messages[msgCount] = */new Message(iMsg, iCallback, childEndpoint, msgCount++, 'down').call();
    }, 'codap-game', window.parent, origin());
  }
  childEndpoint = new iframePhone.IframePhoneRpcEndpoint( function (iMsg, iCallback) {
//          console.log('From child: ' + JSON.stringify(iMsg));
    if (parentEndpoint) {
      /*messages[msgCount] =*/ new Message(iMsg, iCallback, parentEndpoint, msgCount++, 'up').call();
    } else {
      iCallback && iCallback({success:false});
    }
  }, 'codap-game', $('iframe')[0], origin());
}

