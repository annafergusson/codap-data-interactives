// ==========================================================================
//  
//  Author:   jsandoe
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
// ==========================================================================
$(function () {
  var codapInterface = Object.create({
    connection: null,
    connectionState: 'preinit', // ['preinit', 'init', 'active', 'inactive', 'closed']
    requestHandler: null,
    config: null,
    /**
     * Initialize connection.
     *
     * Start connection. Request interactiveFrame to get prior state, if any.
     * Update interactive frame to set name and dimensions.
     *
     * @param config {object} Configuration. Optional properties: title {string},
     *                        version {string}, dimensions {object},
     *                        stateHandler {function}
     */
    init: function (config) {
      function getFrameRespHandler(req, resp) {
        var values = resp && resp.values;
        var stateHandler = this.config && this.config.stateHandler;
        var newFrame = {
          name: config.name,
          title: config.title,
          version: config.version,
          dimensions: config.dimensions
        };
        //Object.assign(newFrame, values);
        updateFrameReq.values = newFrame;
        _this.sendRequest(updateFrameReq);

        if (values && values.state && stateHandler ) {
          _this.config.stateHandler(values.state);
        }
      }

      var getFrameReq = {action: 'get', resource: 'interactiveFrame'};
      var updateFrameReq = {action: 'update', resource: 'interactiveFrame'};
      var _this = this;

      this.config = config;
      this.connection = new iframePhone.IframePhoneRpcEndpoint(
          function (codapRequest, callback) {
            this.connectionState = 'active';
            if (this.requestHandler) {
              callback(this.requestHandler.handleCODAPRequest(codapRequest));
            } else {
              callback({success: true});
            }
          }.bind(this), "data-interactive", window.parent
      );
      this.sendRequest(getFrameReq, getFrameRespHandler);
    },

    setRequestHandler: function (handler) {
      this.requestHandler = handler;
    },
    destroy: function () {},
    sendRequest: function (message, callback) {
      switch (this.connectionState) {
        case 'closed': // log the message and ignore
          console.warn('sendRequest on closed CODAP connection: ' + JSON.stringify(message));
          break;
        case 'preinit': // warn, but issue request.
          console.warn('sendRequest on not yet initialized CODAP connection: ' + JSON.stringify(message));
        default:
          if (this.connection) {
            this.connection.call(message, function (response) {
              this.handleResponse(message, response, callback)
            }.bind(this));
          } else {
            console.error('sendRequest on non-existent CODAP connection');
          }
      }
    },
    handleResponse: function (request, response, callback) {
      if (response === undefined) {
        console.warn('handleResponse: CODAP request timed out');
      } else {
        this.connectionState = 'active';
      }
      if (callback) {
        callback(request, response);
      }
    }
  });

  var extent = {rows: 0, cols: 0};
  var kSrcStackSelector = '#src-stack';
  var kTargetTableSelector = '#target-table';
  var kDataSetSectionSelector = '#DataSetSection';
  var kItemSelector = '.item';
  var kDropAreaClass = 'drop-area';
  var kColumnHeadMessage = 'Enter a name for this value attribute';
  var kRowHeadMessage = 'Enter a name for this categorical value';
  var itemCtr = 0;

  function makeNewRow($tableEl, extent) {
    var row = extent.rows++;
    var ix;
    var $rowEl = $('<tr>').data('row', row );
    var el = $('<input>').prop({
      'value': 'type' + row,
      'title': kRowHeadMessage
    });
    $('<th>').append(el).appendTo($rowEl);
    for (ix = 0; ix < extent.cols; ix += 1) {
      el = $('<div>').addClass(kDropAreaClass);
      $('<td>').data('col', ix).append(el).appendTo($rowEl);
    }
    $tableEl.append($rowEl);
  }

  function makeNewColumn($tableEl, extent) {
    var col = extent.cols++;
    var $rows = $tableEl.find('tr');
    var el;
    $rows.each(function(ix, rowEl) {
      if (ix === 0) {
        el = $('<input>').prop({
          'value': 'value' + col,
          'title': kColumnHeadMessage
        });
        el = $('<th>').append(el);
      } else {
        el = $('<div>').addClass(kDropAreaClass);
        el = $('<td>').data('col', col).append(el);
      }
      $(rowEl).append(el);
    });
  }

  function makeDataSetSelector() {
    function handleResponse(req, resp) {
      var values = resp && resp.values;
      var $root = $('#dataset-selection');
      var $label = $('<label>').text('Data Set: ');
      var $selEl = $('<select>');
      if (values) {
        $root.empty();
        values.forEach(function (item, ix) {
          var $option = $('<option>').prop('value', item.name).text(item.title);
          if (ix === 0) {
            $option.prop('selected', true);
          }
          $option.appendTo($selEl);
        });

        $selEl.appendTo($label);
        $label.appendTo($root)
        $selEl.on('change', handleDataSetSelection);
        $selEl.change();
      }
    }

    var req = {action: 'get', resource: 'dataContextList'};
    codapInterface.sendRequest(req, handleResponse)
  }

  function makeItems(dataSetName) {
    function handleResponse(req, resp) {
      var values = resp && resp.values;
      if (!values) {
        return;
      }
      var numCollections = values.collections?values.collections.length: 0;
      var lastCollection = numCollections && values.collections[numCollections - 1];
      var attributes = lastCollection.attrs;
      var $srcStack = $(kSrcStackSelector + ' .items');
      $(kItemSelector).remove();
      attributes.forEach(function (attr) {
        var itemID = 'item' + itemCtr++;
        $('<div>')
            .addClass('item')
            .prop('id', itemID)
            .text(attr.name)
            .appendTo($srcStack);
      })
    }

    var req = {action: 'get', resource: 'dataContext[' + dataSetName + ']'};
    codapInterface.sendRequest(req, handleResponse)
  }

  function handleDataSetSelection(ev) {
    var dataSetName = $(this).val();
    makeItems(dataSetName);
  }

  function getTableCoordinate($cellEl) {
    var $td = $cellEl.closest('td,th');
    var $tr = $td.closest('tr');
    var col = $td.data('col');
    var row = $tr.data('row');
    return {row: row, col: col};
  }

  function getTableDimensions($tableEl) {
    return extent;
  }

  function isRightmostColumn($tableEl, $cellEl) {
    var coord = getTableCoordinate($cellEl);
    var dimensions = getTableDimensions($tableEl);
    return (coord.col === dimensions.cols - 1);
  }

  function isBottomRow($tableEl, $cellEl) {
    var coord = getTableCoordinate($cellEl);
    var dimensions = getTableDimensions($tableEl);
    return (coord.row === dimensions.rows - 1);
  }

  function updateTable($cellEl) {
    var $tableEl = $(kTargetTableSelector);
    if (isRightmostColumn($tableEl, $cellEl)) {
      makeNewColumn($tableEl, extent);
    }
    if (isBottomRow($tableEl, $cellEl)) {
      makeNewRow($tableEl, extent);
    }
  }

  function handleDragStart(ev) {
//        console.log('start: ' + this.id);
    var oev = ev.originalEvent;
    oev.dataTransfer.effectAllowed = 'move';
    oev.dataTransfer.setData('text/html', this.outerHTML);
    $(this).addClass('active');
    $(kTargetTableSelector + ',' + kSrcStackSelector).addClass('drag-in-progress')
  }

  function handleDragEnd(ev) {
    $(this).removeClass('active');
    $(kTargetTableSelector + ',' + kSrcStackSelector).removeClass('drag-in-progress')
  }

  function handleDragEnter(ev) {
//        console.log('enter');
    if ($('.item', this).length === 0) {
      $(this).addClass('over');
    }
    ev.preventDefault();
  }

  function handleDragOver(ev) {
    // if the cell is occupied, it is not now a drag target
    if ($('.item', this).length > 0) {
      return;
    }
    ev.preventDefault();
    return false;
  }

  function handleDragLeave(ev) {
//        console.log('leave');
    $(this).removeClass('over');
  }

  function handleDrop(ev) {
    var $this = $(this);
    // if the cell is occupied, it is not now a drag target
    if ($('.item', this).length > 0) {
      return;
    }
    var oev = ev.originalEvent;
    var target = this;
    var $srcStack = $(kSrcStackSelector);
    if ($.contains($srcStack[0], this)) {
      target = $srcStack.find('.items');
    } else {
      updateTable($this);
    }

    var $item = $(oev.dataTransfer.getData('text/html'));
    $('#' + $item[1].id).detach().appendTo(target);

    $this.removeClass('over');
    $item.removeClass('active');

    ev.stopPropagation();
    return false;
  }

  function init() {
    codapInterface.init({
      name: 'TidyData',
      title: window.title,
      version: '0.1',
      dimensions: {width: 600, height: 500}
    });

    makeDataSetSelector();

    $(kTargetTableSelector+','+kSrcStackSelector)
        .attr('draggable', '.item', true)
        .on('dragstart', '.item', handleDragStart)
        .on('dragend', '.item', handleDragEnd);

    $(kTargetTableSelector+','+kSrcStackSelector)
        .on('dragenter', '.' + kDropAreaClass, handleDragEnter)
        .on('dragover', '.' + kDropAreaClass, handleDragOver)
        .on('dragleave', '.' + kDropAreaClass, handleDragLeave)
        .on('drop', '.' + kDropAreaClass, handleDrop);

    makeNewColumn($(kTargetTableSelector), extent);
    makeNewRow($(kTargetTableSelector), extent);
  }

  init();
})
