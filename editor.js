(function(glob) {
	
	var TableEdit = function(tableInput,options) {
		var self = this;
		
		self.options = options && options instanceof Object ? options : {};
		self.table =
			tableInput && tableInput instanceof HTMLTableElement ? 
				tableInput : document.createElement("table");
		
		self.rowIndex = [];
		self.colIndex = [];
		
		function getOrMakeTableTag(tag) {
			self[tag] =
				self.table.getElementsByTagName(tag).length ?
					[].slice.call(self.table.getElementsByTagName(tag),0) :
					document.createElement(tag);
		}
		
		[	"thead",
			"tbody",
			"tfoot",
			"summary" ].forEach(getOrMakeTableTag);
		
		// Now build an internal representation of our rows and columns...
		self.updateIndices();
		
		self.addRow("header",1);
		
		console.log(self.rowIndex);
		console.log(self.colIndex);
		
		log = console.log.bind(console);
		self.colIndex.forEach(log);
		
		return self;
	};
	
	TableEdit.prototype.updateIndices = function() {
		var self = this;
		
		// For now, we don't deal with colspan or rowspan.
		
		// First, get an idea of how many rows we're dealing with.
		self.rowIndex = [].slice.call(self.table.getElementsByTagName("tr"),0);
		
		// Now loop through each row and generate column indexes.
		self.rowIndex.forEach(function(row,index) {
			// First, get a sanitised list of cells.
			// Try not to rely on QSA - ES5 array methods can be polyfilled
			// more easily than QSA can.
			var cells = 
				[].slice.call(row.childNodes,0).filter(function(node) {
					return node.nodeType === 1 &&
						(node instanceof HTMLTableCellElement);
				});
			
			// Now loop through each cell
			cells.forEach(function(cell, index) {
				if (index > self.colIndex.length-1)
					return self.colIndex.push([cell]);
				
				self.colIndex[index].push(cell);
			});
		});
		
		return self;
	};
	
	TableEdit.prototype.addRow = function(kind,position) {
		var self = this;
		
		// Ensure the position we've got is reasonable and not way
		// out of bounds.
		if (position > self.rowIndex.length)
			position = self.rowIndex.length;
		
		if (position < 0) position = 0;
		
		// Create our new row
		var newRow = document.createElement("tr");
		
		// Populate with new cells
		while (newRow.childNodes.length < self.colIndex.length) {
			var cell = document.createElement(kind === "header" ? "th" : "td");
			newRow.appendChild(cell);
		}
		
		if (position === self.rowIndex.length) {
			
		}
		
		return self;
	};
	
	TableEdit.prototype.removeRow = function(rowIdentifier) {
		var self = this;
		
		return self;
	};
	
	TableEdit.prototype.addColumn = function(kind,position) {
		var self = this;
		
		return self;
	};
	
	TableEdit.prototype.removeColumn = function(colIdentifier) {
		var self = this;
		
		return self;
	};
	
	TableEdit.prototype.renderTo = function(destination) {
		var self = this;
		
		destination.appendChild(self.table);
		self.emit("renderto");
		
		return self;
	};
	
	TableEdit.prototype.alterCell = function(cellData) {
		var self = this;
		
		return self;
	}
	
	TableEdit.prototype.summary = function() {
		var self = this;
		
		return self;
	};
	
	/*
		Public: Function for binding a handler to a TableEdit event.
		
		eventName	-	String - name of event to bind handler to.
		handler		-	Function which is bound to the event.
		
		Examples
		
			myTable.on("renderupdate",updateMyAppUI);
			myVideo.on("newcolumn",function(column) {
				console.log("A new column! I see it!");
			});
		
		Returns the TableEdit object to which the handler was bound.
	
	*/
	TableEdit.prototype.on = function(eventName,handler) {
		var self = this;
		
		// We must have a valid name...
		
		if (!eventName ||
			typeof eventName !== "string" ||
			eventName.match(/[^a-z0-9\.\*\-]/ig)) {
			
			throw new Error("Attempt to subscribe to event with invalid name!");
		}
		
		// We've gotta have a valid function
		if (!handler || !(handler instanceof Function)) {
			throw new Error("Attempt to subscribe to event without a handler!");
		}
		
		// OK, we got this far.
		// Create handler object if it doesn't exist...
		if (!self.eventHandlers || !(self.eventHandlers instanceof Object)) {
			self.eventHandlers = {};
		}
		
		if (self.eventHandlers[eventName] &&
			self.eventHandlers[eventName] instanceof Array) {
			
			self.eventHandlers[eventName].push(handler);
		} else {
			self.eventHandlers[eventName] = [handler];
		}
		
		return self;
	};
	
	
	/*
		Private: Called by TableEdit internally when emitting an event. This
		function is responsible for calling all the event handlers in turn.
		
		eventName	-	used to determine which event is being emitted.
		
		Examples
		
			this.emit("pause");
			
		Returns the TableEdit object which emitted the event in question.
	
	*/
	TableEdit.prototype.emit = function(eventName) {
		var self = this, args = arguments;
		
		// If we've lost our handler object, or have no handlers, just return.
		if (!self.eventHandlers) return;
		
		// Ensure we've got handlers in the format we expect...
		if (!self.eventHandlers[eventName] ||
			!(self.eventHandlers[eventName] instanceof Array)) return;
		
		// OK, so we have handlers for this event.
		self.eventHandlers[eventName]
			// We need these to be functions!
			.filter(function(handler) {
				return handler instanceof Function;
			})
			.forEach(function(handler) {
				// Execute each handler in the context of the Vixen object,
				// and with the arguments we were passed (less the event name)
				handler.apply(self,[].slice.call(args,1));
			});
		
		
		
		return self;
	};
	
	glob.TableEdit = TableEdit;
	
})(this);

