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
					self.table.getElementsByTagName(tag)[0] :
					document.createElement(tag);
		}
		
		[	"thead",
			"tbody",
			"tfoot",
			"summary" ].forEach(getOrMakeTableTag);
		
		// Now build an internal representation of our rows and columns...
		self.update();
		
		self.addRow("header",1);
		self.addRow("normal",4);
		self.removeRow(0);
		
		self.addRow("header");
		self.addRow("header");
		self.addRow("headesdr");
		self.addRow("headesdr");
		self.addRow("header");
		
		self.addColumn("header",0);
		self.addColumn("header");
		self.addColumn();
		self.addColumn();
		self.addColumn();
		
		self.removeColumn(0);
		self.removeColumn(0);
		self.removeColumn(0);
		
		
		self.addRow("header",1);
		console.log(self.rowIndex);
		console.log(self.colIndex);
		
		self.colIndex.forEach(console.log.bind(console));
		
		self.update();
		self.colIndex.forEach(function(col,x) {
			var offset = x % 2;
			
			col.forEach(function(cell,y) {
				var kind = ["header","normal"][(y+offset)%2];
				self.alterCell(x,y,x*y);
				self.changeCellType(x,y,kind,true);
			});
		});
		self.update();
		
		
		return self;
	};
	
	TableEdit.prototype.update = function() {
		var self = this;
		
		self.updateSectionElements()
			.updateIndices()
			.updateCellStates();
		
		return self;
	};
	
	TableEdit.prototype.updateIndices = function() {
		var self = this;
		
		// For now, we don't deal with colspan or rowspan.
		
		// First, get an idea of how many rows we're dealing with.
		self.rowIndex = [].slice.call(self.table.getElementsByTagName("tr"),0);
		
		// Clear colindex
		self.colIndex = [];
		
		// Now loop through each row and generate column indexes.
		self.rowIndex.forEach(function(row,index) {
			// Save our row index!
			row.index = index;
			
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
				cell.index = index;
				
				if (index > self.colIndex.length-1)
					return self.colIndex.push([cell]);
				
				self.colIndex[index].push(cell);
			});
		});
		
		return self;
	};
	
	TableEdit.prototype.updateSectionElements = function() {
		var self = this;
		
		[	"summary",
			"thead",
			"tbody",
			"tfoot" ]
			.map(function(item) {
				if (self[item].parentNode) {
					self.table.removeChild(self[item]);
				}
				
				return item;
			})
			.forEach(function(key,index,array) {
				var cells = 
					[].slice.call(self[key].childNodes,0)
						.filter(function(node) {
							return node.nodeType === 1;
						});
				
				if (cells.length) {
					self.table.appendChild(self[key]);
				}
			});
			
		return self;
	};
	
	TableEdit.prototype.updateCellStates = function() {
		var self = this;
		
		self.colIndex.forEach(function(col) {
			col.forEach(function(cell) {
				cell.setAttribute("contenteditable","true");
				cell.innerText = cell.innerText;
			});
		});
		
		return self;
	};
	
	TableEdit.prototype.addRow = function(kind,position) {
		var self = this;
		
		if (position === null || position === undefined)
			position = self.rowIndex.length;
		
		// Ensure the position we've got is reasonable and not way
		// out of bounds.
		if (position > self.rowIndex.length)
			position = self.rowIndex.length;
		
		if (position < 0) position = 0;
		
		// Create our new row
		var newRow = document.createElement("tr");
		
		// Populate with new cells
		while (newRow.childNodes.length < self.colIndex.length) {
			var cell =
				document.createElement(
							kind === "header" ||
							kind === "footer" ?
							"th" : "td");
			cell.innerHTML = "sd"
			newRow.appendChild(cell);
		}
		
		// Get previous and next rows
		var prevRow = position > 0 ? self.rowIndex[position-1] : null,
			nextRow	= self.rowIndex[position];
		
		// General rule: inherit table section downward through the table, from
		// the previous row.
		
		// If new row is before any element in thead, we're in thead
		if (nextRow && nextRow.parentNode === self.thead) {
			
			self.thead.insertBefore(newRow,nextRow);
		
		// If the new row is a header directly after an element in thead we're in thead
		} else if (nextRow && prevRow.parentNode === self.thead && kind === "header") {
			
			self.thead.appendChild(newRow);
		
		// If the new row is after any element in tfoot, we're in tfoot.
		} else if (prevRow && prevRow.parentNode === self.tfoot) {
			
			if (nextRow) {
				self.tfoot.insertBefore(newRow,nextRow);
			} else {
				self.tfoot.appendChild(newRow)
			}
		
		// If the new row is a header directly before an element in tfoot we're in tfoot
		} else if (nextRow && nextRow.parentNode === self.tfoot && kind === "header") {
			
			self.tfoot.insertBefore(newRow,nextRow);
		
		// Or, if we're the first row and type header, we're in thead
		} else if (position === 0 && kind === "header") {
			
			if (nextRow) {
				self.thead.insertBefore(newRow,nextRow);
			} else {
				self.thead.appendChild(newRow)
			}
		
		// Or, if we're the last row and type header, we're in tfoot
		} else if (position === self.rowIndex.length && kind === "header") {
			
			self.tfoot.appendChild(newRow);
		
		// And if nothing else matches, we must be in tbody.
		// Add new row in a sensible location!
		} else {
			
			if (nextRow && nextRow.parentNode === self.tbody) {
				self.tbody.insertBefore(newRow,nextRow);
			} else {
				self.tbody.appendChild(newRow)
			}
			
		}
		
		// Update table information!
		self.update();
		
		return self;
	};
	
	TableEdit.prototype.removeRow = function(rowIdentifier) {
		var self = this;
		
		// Map back from an HTML element to a row index if that's what we
		// were supplied!
		if (rowIdentifier instanceof HTMLElement) {
			rowIdentifier = rowIdentifier.index;
		}
		
		if (self.rowIndex[rowIdentifier]) {
			self.rowIndex[rowIdentifier]
				.parentNode.removeChild(self.rowIndex[rowIdentifier]);
		} else {
			throw new Error("Row could not be located in index!");
		}
		
		// Update the internal representation of the table.
		self.update();
		
		return self;
	};
	
	TableEdit.prototype.addColumn = function(kind,position) {
		var self = this;
		
		if (position === null || position === undefined)
			position = self.colIndex.length;
		
		// Ensure the position we've got is reasonable and not way
		// out of bounds.
		if (position > self.colIndex.length)
			position = self.colIndex.length;
		
		if (position < 0) position = 0;
		
		// Loop through all rows, appending column at current position.
		self.rowIndex.forEach(function(row) {
			var newCell =
				document.createElement((
					kind === "header" ||
					kind === "footer" ? "th" : "td"));
			
			if (position === self.colIndex.length) {
				row.appendChild(newCell);
			} else {
				var cells = 
					[].slice.call(row.childNodes,0).filter(function(node) {
						return node.nodeType === 1 &&
							(node instanceof HTMLTableCellElement);
					});
				
				row.insertBefore(newCell,cells[position]);
			}
		});
		
		self.update();
		
		return self;
	};
	
	TableEdit.prototype.removeColumn = function(colIdentifier) {
		var self = this;
		
		// Map back from an HTML element to a col index if that's what we
		// were supplied!
		if (colIdentifier instanceof HTMLElement) {
			colIdentifier = colIdentifier.index;
		}
		
		if (self.colIndex[colIdentifier]) {
			
			self.colIndex[colIdentifier].forEach(function(cell) {
				var row = cell.parentNode;
				var cells = 
					[].slice.call(row.childNodes,0).filter(function(node) {
						return node.nodeType === 1 &&
							(node instanceof HTMLTableCellElement);
					});
				
				row.removeChild(cell);
				
				// If there's nothing left in this row...
				if (!cells.length) {
					row.parentNode.removeChild(cell);
				}
			});
		} else {
			throw new Error("Row could not be located in index!");
		}
		
		// Update the internal representation of the table.
		self.update();
		
		return self;
	};
	
	TableEdit.prototype.renderTo = function(destination) {
		var self = this;
		
		destination.appendChild(self.table);
		self.emit("renderto");
		
		return self;
	};
	
	TableEdit.prototype.changeCellType = function(x,y,newType,bulk) {
		var self = this;
		
		if (self.colIndex[x]) {
			if (self.colIndex[x][y]) {
				// Get cell and normalise types for easy comparison
				var cell = self.colIndex[x][y],
					oldType = cell.tagName === "TH" ? "th" : "td";
					newType =	newType === "header" ||
								newType === "footer" ? "th" : "td";
				
				if (oldType !== newType) {
					var cellText = cell.innerText,
						newCell = document.createElement(newType);
					
					newCell.innerText = cellText;
					
					// Now replace the old cell with the new one
					cell.parentNode.replaceChild(newCell, cell);
				}
				
			} else {
				throw new Error("Requested cell Y value out of bounds.");
			}
		} else {
			throw new Error("Requested cell X value out of bounds.");
		}
		
		if (!bulk) self.update();
		
		return self;
	};
	
	TableEdit.prototype.changeRowType = function(y,newType) {
		var self = this;
		
		if (self.rowIndex[y]) {
			
			for (var x = 0; x < self.colIndex.length; x++) {
				self.changeCellType(x,y,newType,true);
			}
			
			self.update();
			
		} else {
			throw new Error("Requested row index out of bounds.");
		}
		
		return self;
	};
	
	TableEdit.prototype.changeColType = function(x,newType) {
		var self = this;
		
		if (self.colIndex[x]) {
			
			self.colIndex.forEach(function(cell,y) {
				self.changeCellType(x,y,newType,true);
			});
			
			self.update();
			
		} else {
			throw new Error("Requested column index out of bounds.");
		}
		
		return self;
	};
	
	TableEdit.prototype.alterCell = function(x,y,cellText) {
		var self = this;
		
		if (self.colIndex[x]) {
			if (self.rowIndex[y]) {
				
				var cell = self.colIndex[x][y];
					cell.innerText = cellText;
				
			} else {
				throw new Error("Requested row index out of bounds.");
			}
		} else {
			throw new Error("Requested column index out of bounds.");
		}
		
		self.update();
		
		return self;
	}
	
	TableEdit.prototype.summary = function(value) {
		var self = this;
		
		if (!!value) {
			self.summary.innerText = value;
			self.update();
		} else {
			return self.summary.innerText;
		}
		
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

