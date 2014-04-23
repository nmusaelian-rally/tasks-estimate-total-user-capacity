Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'iteration',
    comboboxConfig: {
        fieldLabel: 'Select an Iteration:',
        labelWidth: 100,
        width: 300
    },
            
    addContent: function() {
        
        this._makeStore();
    },
    
    _makeStore: function(){
         Ext.create('Rally.data.WsapiDataStore', {
            model: 'Task',
            fetch: ['FormattedID','Name','Owner','Estimate'],
            pageSize: 100,
            autoLoad: true,
            filters: [this.getContext().getTimeboxScope().getQueryFilter()],
            /*
            context:{ //added to use with App-debug.html
                project: '/project/16177142574' 
            },*/
            listeners: {
                load: this._onTasksLoaded,
                scope: this
            }
        }); 
    },
    
   onScopeChange: function() {
        this._makeStore();
    },
    
    _onTasksLoaded: function(store, data){
            this.tasks = data;
            //console.log('tasks', this.tasks);
            Ext.create('Rally.data.WsapiDataStore', {
                model: 'UserIterationCapacity',
                fetch: ['User', 'TaskEstimates', 'Iteration', 'Capacity'],  
                pageSize: 100,
                autoLoad: true,
                filters: [this.getContext().getTimeboxScope().getQueryFilter()],
                listeners: {
                    load: this._onAllDataLoaded,
                    scope: this
                }
            }); 
    },
       _onAllDataLoaded: function(store, data){
            var that = this;
            var pendingTasks = this.tasks.length;
                var tasks = [];
                var users = [];
                if (data.length ===0) {
                    this._createGrid();  //to force refresh on grid when there are no testsets in the iteration
                }
                _.each(that.tasks, function(task) {
                    console.log('tasks', that.tasks);
                    var owner = task.get('Owner'); 
                    var total;
                    var cap;
                        _.each(data, function(capacity){
                            //some tasks have no owner. If this condition is not checked Uncaught TypeError: Cannot read property '_refObjectName' of null 
                            if (owner && capacity.get('User')._refObjectName === owner._refObjectName) { 
                                total = capacity.get('TaskEstimates');
                                cap = capacity.get('Capacity');
                            }
                            });
                            var t  = {
                                FormattedID: task.get('FormattedID'),
                                _ref: task.get("_ref"),  
                                Name: task.get('Name'),
                                Estimate: task.get('Estimate'),
                                Owner: (owner && owner._refObjectName) || 'None',
                                Capacity: cap,
                                TaskEstimates: total
                            };
                             tasks.push(t);
                            --pendingTasks;
                             if (pendingTasks === 0) {
                                that._createGrid(tasks);
                            }       
                 });

 },

     _createGrid: function(stories) {
        var myStore = Ext.create('Rally.data.custom.Store', {
                data: stories,
                pageSize: 100,  
            });
        if (!this.grid) {
        this.grid = this.add({
            xtype: 'rallygrid',
            itemId: 'mygrid',
            store: myStore,
            columnCfgs: [
                {
                   text: 'Formatted ID', dataIndex: 'FormattedID', xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                },
                {
                    text: 'Name', dataIndex: 'Name'
                },
                {
                    text: 'Estimate', dataIndex: 'Estimate'
                },
                 {
                    text: 'Owner', dataIndex: 'Owner'
                },
                {
                    text: 'User Iteration Capacity', dataIndex: 'Capacity'
                },
                {
                    text: 'Task Estimates Total', dataIndex: 'TaskEstimates'
                }
            ]
        });
         
         }else{
            this.grid.reconfigure(myStore);
         }
    }
    
});

