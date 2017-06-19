//=================================================================
//
//   Author: Miguel Gutierrez
//   Date: June 2017
//
//  Copyright (c) 2016 by The Concord Consortium, Inc. All rights reserved.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//=================================================================
var ChartModel = function(){
  this.contextList = [];
  this.selected = {
    context: null,
    attribute: null,
    chartType: null
  };
  this.changeContextCountEvent = new Event(this);
};
ChartModel.prototype = {
  updateDataContextList: function(){
        getData().then((newContextList) => {
          for (var i = 0; i < newContextList.length; i++) {
            if( !this.hasContext(newContextList[i]) ){
              this.contextList.push( new Context(newContextList[i].name, newContextList[i].title, newContextList[i].id));
              this.changeContextCountEvent.notify(
                {name: newContextList[i].name}
              );
            }
          }
        });
  },
  hasContext: function(context){
    for(i = 0; i < this.contextList.length; i++){
      if(this.contextList[i].id == context.id){
        return true;
      }
    }
    return false;
  }
};
//This is the attribute object
var Attribute = function(name, id, collection, color){
  this.name = name || '';
  this.id = id || -1;
  this.collection = collection || '';
  this.color = color || 'white';
};
//this saves basic information for the context
// the functions will allow access to information about
// its attributes
var Context = function(name, title, id){
  this.name = name || '';
  this.title = title || '';
  this.id = id || '';
  this.collectionList = [];
  this.totalCollections = 0;
  this.attributeList = [];
  this.totalAttributes = 0;
};
