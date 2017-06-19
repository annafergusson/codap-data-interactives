var ChartController = function(model, view){
  this.model = model;
  this.view = view;


  this.init();
};
ChartController.prototype = {
  init: function(){
    this.createChildren()
    .setupHandlers()
    .enable()
    .codapListeners();
  },
  createChildren: function(){
    return this;
  },
  setupHandlers: function(){
    this.contextHandler = this.contextCountChanged.bind(this);
    return this;
  },
  enable: function(){
    return this;
  },
  codapListeners: function(){
    codapInterface.on('documentChangeNotice', 'dataContextCountChanged', this.contextHandler);
  },
  contextCountChanged: function(){
    this.model.updateDataContextList();
  }
};
