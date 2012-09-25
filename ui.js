(function(glob) {

	var TableEditUI = function(editor) {
		var self = this;
		
		if (!(editor instanceof TableEdit))
			throw new Error("UI must be constructed with an instanceof TableEdit.");
		
		self.editor = editor;
		self.table = editor.table;
		self.rowGuide = document.createElement("ul");
		self.colGuide = document.createElement("ul");
		
		// Assign some basic classes...
		self.rowGuide.className = "tableedit-rowguide";
		self.colGuide.className = "tableedit-colguide";
		self.colGuide.style.position = self.rowGuide.style.position = "fixed";
		
		// Assign a class to the table being edited...
		self.table.className += " tableedit-active";
		
		// Listen to table update events...
		self.editor.on("update",self.update.bind(self));
		
		// And to any document or interaction events we might need to keep our UI looking nice...
		var posUpdate = self.updatePositioning.bind(self);
		window.addEventListener("resize",posUpdate);
		document.addEventListener("scroll",posUpdate);
		self.table.addEventListener("keydown",posUpdate);
		self.table.addEventListener("keyup",posUpdate);
		
		for (var i = 0; i < 25; i++)
			self.editor.addRow();
		
		return self;
	};
	
	TableEditUI.prototype.getElementOffset = function(element) {
		var offset = {x: 0, y: 0, width: 0, height: 0};
		
		if (element instanceof HTMLElement) {
			
			offset.width = element.offsetWidth;
			offset.height = element.offsetHeight;
			
			do {
				offset.x += element.offsetLeft;
				offset.y += element.offsetTop;
				
			} while ((element = element.offsetParent));
			
			return offset;
			
		} else {
			throw new Error("");
		}
	};
	
	TableEditUI.prototype.update = function() {
		var self = this;
		
		self.rowGuide.innerHTML = "";
		self.colGuide.innerHTML = "";
		
		function menuItem(text,handler) {
			var menuItem = document.createElement("li");
				menuItem.innerHTML = text;
			
			menuItem.addEventListener("click",handler);
			return menuItem;
		}
		
		// Generate list items for rows and cols.
		self.editor.rowIndex.forEach(function(row,index) {
			var rowTab = document.createElement("li"),
				rowTabLabel = document.createElement("label"),
				rowTabMenu = document.createElement("ul");
			
			rowTabLabel.innerHTML = index+1;
			rowTab.appendChild(rowTabLabel);
			rowTab.appendChild(rowTabMenu);
			self.rowGuide.appendChild(rowTab);
			
			rowTabMenu.appendChild(menuItem(
				"Delete Row",
				function() {
					self.editor.removeRow(row);
				}
			));
			
			rowTabMenu.appendChild(menuItem(
				"Insert Header Before",
				function() {
					self.editor.addRow("header",index);
				}
			));
			
			rowTabMenu.appendChild(menuItem(
				"Insert Header After",
				function() {
					self.editor.addRow("header",index+1);
				}
			));
			
			rowTabMenu.appendChild(menuItem(
				"Insert Row Before",
				function() {
					self.editor.addRow("normal",index);
				}
			));
			
			rowTabMenu.appendChild(menuItem(
				"Insert Row After",
				function() {
					self.editor.addRow("normal",index+1);
				}
			));
		});
		
		self.editor.colIndex.forEach(function(col,index) {
			var colTab = document.createElement("li"),
				colTabLabel = document.createElement("label"),
				colTabMenu = document.createElement("ul");
			
			var unitAlpha	= index % 26,
				globalAlpha	= (index / 26) | 0,
				alphaString	= String.fromCharCode(unitAlpha+65);
			
			if (globalAlpha > 0) alphaString = String.fromCharCode(globalAlpha+64) + alphaString;
			
			colTabLabel.innerHTML = alphaString;
			colTab.appendChild(colTabLabel);
			colTab.appendChild(colTabMenu);
			self.colGuide.appendChild(colTab);
		});
		
		self.updatePositioning();
		
		return self;
	};
	
	TableEditUI.prototype.updatePositioning = function() {
		var self = this;
		
		// The UI centers around the table. So get the table offset...
		var tableOffset = self.getElementOffset(self.table);
		
		var scrollTop		= document.body.scrollTop >= 0 ? document.body.scrollTop : 0,
			scrollLeft		= document.body.scrollLeft >= 0 ? document.body.scrollLeft : 0,
			wheight			= window.innerHeight,
			wwidth			= window.innerWidth,
			top				= (tableOffset.y - scrollTop),
			left			= (tableOffset.x - scrollLeft),
			height			= tableOffset.height,
			width			= tableOffset.width,
			viewportBase	= scrollTop + wheight,
			viewportRight	= scrollLeft + wwidth,
			tableBase		= tableOffset.height + tableOffset.y,
			tableRight		= tableOffset.width + tableOffset.x;
		
		// Check to ensure our values are in bounds...
		scrollTop = scrollTop + wheight > document.body.scrollHeight ?
						document.body.scrollHeight - wheight : scrollTop;
		
		scrollLeft = scrollLeft + wwidth > document.body.scrollWidth ?
						document.body.scrollLeft - wwidth : scrollLeft;
		
		var rowGuideScrollTop = top-40 <= 0 ? (top-40)*-1 : 0,
			colGuideScrollLeft = left-40 <= 0 ? (left-40)*-1 : 0;
		
		// And compute the final dimensions...
		top		= top <= 40 ? 40 : top;
		left	= left <= 40 ? 40 : left;
		height	= top + height > wheight - 3 ? wheight - top - 3: height;
		width	= left + width > wwidth - 3 ? wwidth - left - 3: width;
		height	= ((tableBase-scrollTop)-top) < height ? ((tableBase-scrollTop)-top) : height;
		width	= ((tableRight-scrollLeft)-left) < width ? ((tableRight-scrollLeft)-left) : width;
		
		// First of all - position row and colguides...
		self.rowGuide.style.height = height + "px";
		self.rowGuide.style.top =  top + "px";
		self.rowGuide.style.left =  left + "px";
		self.rowGuide.scrollTop = rowGuideScrollTop;
		
		self.colGuide.style.width = width + "px";
		self.colGuide.style.top = top + "px";
		self.colGuide.style.left = left + "px";
		self.colGuide.scrollLeft = colGuideScrollLeft;
		
		// Set the dimensions of children in the row and col guides
		var cumulativeRowHeight = 0;
		[].slice.call(self.rowGuide.childNodes)
			.forEach(function(node,index) {
				if (self.editor.rowIndex[index]) {
					var rowDimensions =
						self.getElementOffset(self.editor.rowIndex[index]);
					
					node.style.height = rowDimensions.height + "px";
					node.style.top = cumulativeRowHeight + "px";
					cumulativeRowHeight += rowDimensions.height;
				}
			});
		
		var cumulativeColWidth = 0;
		[].slice.call(self.colGuide.childNodes)
			.forEach(function(node,index) {
				if (self.editor.colIndex[index]) {
					var col = self.editor.colIndex[index][0],
						colDimensions =
							self.getElementOffset(col);
					
					node.style.width = colDimensions.width + "px";
					node.style.left = cumulativeColWidth + "px";
					cumulativeColWidth += colDimensions.width;
				}
			});
		
		return self;
	};
	
	TableEditUI.prototype.render = function() {
		var self = this;
		
		document.body.appendChild(self.rowGuide);
		document.body.appendChild(self.colGuide);
		self.update();
		
		return self;
	};
	
	glob.TableEditUI = TableEditUI;

})(this);