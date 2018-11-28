/*
 * ==========================================================================
 * Copyright (c) 2018 by eeps media.
 * Last modified 8/21/18 9:07 AM
 *
 * Created by Tim Erickson on 8/21/18 9:07 AM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS-IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 * ==========================================================================
 *
 */

app.userActions = {

  pressGetCasesButton : async function() {
    console.log("get cases!");
    let oData = [];
    app.ui.displayStatus('Fetching data...');
    let tData = await app.DBconnect.getCasesFromDB(app.state.selectedAttributes,
      app.state.selectedStates, app.state.selectedYears);

    //  okay, tData is an Array of objects whose keys are the variable names.
    //  now we have to translate names and values...
    app.ui.displayStatus('Formatting data...');
    tData.forEach( c => {
        //  c is a case object
      let sampleData = c.sample_data;
      let o = { sample : app.state.sampleNumber };
      Object.values(app.allAttributes).forEach(function (attr) {
        if (attr.chosen) {
          o[attr.title] = attr.decodeValue(sampleData);
        }
      });
      oData.push(o);
    });

    //     make sure the case table is showing

    app.ui.displayStatus('Opening case table...');
    await app.CODAPconnect.makeCaseTableAppear();

    // console.log("the cases: " + JSON.stringify(oData));

    app.ui.displayStatus('Sending data to codap...');
    await app.CODAPconnect.saveCasesToCODAP( oData );
    app.ui.displayStatus('');
    app.state.sampleNumber++;
  },

  changeAttributeCheckbox : function(iAttName) {
    const tAtt = app.allAttributes[iAttName];

    tAtt.chosen = !tAtt.chosen;
    app.updateStateFromDOM('Attribute selection changed.');
  },
  changeSampleYearsCheckbox : function (/*event*/) {
    app.updateStateFromDOM('Sample years changed.');
  },
  changeSampleStateCheckbox : function (/*event*/) {
    // record change of status for selected states and potentially toggle 'all' option
    if ($(this).hasClass('select-all')) {
      $('#chooseStatesDiv .select-item').prop('checked', false);
    }
    // noinspection JSJQueryEfficiency
    let $itemBoxes = $('#chooseStatesDiv .select-item');
    let $allBox = $('#chooseStatesDiv .select-all');
    if ($itemBoxes.filter(':checked').length > 0) {
      $allBox.prop('checked',false);
    } else {
      $allBox.prop('checked', true);
    }
    app.updateStateFromDOM('sample state changed');
  },

  // clickMakeMapButton : async function() {
  //     const thePUMA = Number(document.getElementById("pumaNumberBox").value);
  //     const latlong = await app.DBconnect.getLatLon( thePUMA );
  //
  //     if (latlong) {
  //       console.log("latlon received: " + JSON.stringify(latlong));
  //       const googleLatLong = new google.maps.LatLng(latlong.lat, latlong.long);
  //       app.map.setCenter(googleLatLong);
  //       const marker = new google.maps.Marker({
  //         position: googleLatLong,
  //         map: app.map
  //       });
  //     } else {
  //       console.log('Perhaps ' + thePUMA + ' is not a real PUMA?');
  //     }
  //
  // },
  getSelectedYears: function () {
    let rslt = [];
    $('#chooseSampleYearsDiv .select-item:checked').each(function (ix, el) {
      rslt.push(el.id.replace('year-', ''));
    });
    return rslt;
  },
  getSelectedStates: function () {
    let rslt = [];
    $('#chooseStatesDiv .select-item:checked').each(function (ix, el) {
      rslt.push(el.id.replace('state-', ''));
    });
    return rslt;
  },
  // getSelectedAttributes: function () {
  //   let rslt = [];
  //   return rslt;
  // },
  getSelectedSampleSize: function () {
    return $("#sampleSizeInput")[0].value;
  }

};