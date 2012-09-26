(function(glob) {

	var TableEditUI = function(editor) {
		var self = this;
		
		if (!(editor instanceof TableEdit))
			throw new Error("UI must be constructed with an instanceof TableEdit.");
		
		self.editor = editor;
		self.table = editor.table;
		self.rowGuide = document.createElement("ul");
		self.colGuide = document.createElement("ul");
		self.menuElement = document.createElement("ul");
		self.menuObscurer = document.createElement("div");
		self.menuElement.className = "tableedit-menu";
		
		// Assign some basic classes...
		self.rowGuide.className = "tableedit-rowguide";
		self.colGuide.className = "tableedit-colguide";
		self.colGuide.style.position = self.rowGuide.style.position = "fixed";
		self.menuObscurer.className = "tableedit-obscurer";
		
		// Assign a class to the table being edited...
		self.table.className += " tableedit-active";
		
		// Listen to table update events...
		self.editor.on("update",self.update.bind(self));
		
		// And to any document or interaction events we might need to keep
		// our UI looking nice...
		var posUpdate = self.updatePositioning.bind(self);
		window.addEventListener("resize",posUpdate);
		document.addEventListener("scroll",posUpdate);
		self.table.addEventListener("keydown",posUpdate);
		self.table.addEventListener("keyup",posUpdate);
		
		// And now set some events for our obscure-layer
		function cancelMenu() {
			document.body.removeChild(self.menuObscurer);
			document.body.removeChild(self.menuElement);
		}
		
		self.menuObscurer.addEventListener('click',cancelMenu);
		self.menuObscurer.addEventListener('touchstart',cancelMenu);
		
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
	
	TableEditUI.prototype.showMenu = function(orientation,tab,object) {
		var self = this;
		
		var objectName = orientation === "row" ? "Row" : "Column",
			index = object.index !== undefined ? object.index : object[0].index;
		
		function menuItem(text,handler) {
			var menuItemLi = document.createElement("li");
				menuItemLi.innerHTML = text;
			
			function handleMenu() {
				document.body.removeChild(self.menuObscurer);
				document.body.removeChild(self.menuElement);
				handler();
			}
			
			menuItemLi.addEventListener("click",handleMenu);
			menuItemLi.addEventListener("touchstart",handleMenu);
			return menuItemLi;
		}
		
		self.menuElement.innerHTML = "";
		document.body.appendChild(self.menuObscurer);
		document.body.appendChild(self.menuElement);
		
		var tabPosition = self.getElementOffset(tab),
			menuX = tabPosition.x + (orientation === "row" ? tabPosition.width : 0),
			menuY = tabPosition.y + (orientation !== "row" ? tabPosition.height : 0);
		
		self.menuElement.appendChild(menuItem(
			"Delete " + objectName,
			function() {
				self.editor["remove" + objectName](index);
			}
		));
		
		self.menuElement.appendChild(menuItem(
			"Insert Header " + objectName + " Before",
			function() {
				self.editor["add" + objectName]("header",index);
			}
		));
		
		self.menuElement.appendChild(menuItem(
			"Insert Header " + objectName + " After",
			function() {
				self.editor["add" + objectName]("header",index+1);
			}
		));
		
		self.menuElement.appendChild(menuItem(
			"Insert " + objectName + " Before",
			function() {
				self.editor["add" + objectName]("normal",index);
			}
		));
		
		self.menuElement.appendChild(menuItem(
			"Insert " + objectName + " After",
			function() {
				self.editor["add" + objectName]("normal",index+1);
			}
		));
		
		self.menuElement.appendChild(menuItem(
			"Convert to header " + objectName.toLowerCase(),
			function() {
				self.editor["change" + objectName + "Type"](index,"header");
			}
		));
		
		self.menuElement.appendChild(menuItem(
			"Convert to regular " + objectName.toLowerCase(),
			function() {
				self.editor["change" + objectName + "Type"](index,"normal");
			}
		));
		
		self.menuElement.style.left = menuX + "px";
		self.menuElement.style.top = menuY + "px";
		
		return self;
	};
	
	TableEditUI.prototype.update = function() {
		var self = this;
		
		self.rowGuide.innerHTML = "";
		self.colGuide.innerHTML = "";
		
		// Generate list items for rows and cols.
		self.editor.rowIndex.forEach(function(row,index) {
			var rowTab = document.createElement("li"),
				rowTabLabel = document.createElement("label");
			
			rowTabLabel.innerHTML = index+1;
			rowTab.appendChild(rowTabLabel);
			self.rowGuide.appendChild(rowTab);
			
			rowTab.addEventListener("click",function() {
				self.showMenu("row",rowTab,row);
			});
		});
		
		self.editor.colIndex.forEach(function(col,index) {
			var colTab = document.createElement("li"),
				colTabLabel = document.createElement("label");
			
			var unitAlpha	= index % 26,
				globalAlpha	= (index / 26) | 0,
				alphaString	= String.fromCharCode(unitAlpha+65);
			
			if (globalAlpha > 0) alphaString = String.fromCharCode(globalAlpha+64) + alphaString;
			
			colTabLabel.innerHTML = alphaString;
			colTab.appendChild(colTabLabel);
			self.colGuide.appendChild(colTab);
			
			colTab.addEventListener("click",function() {
				self.showMenu("col",colTab,col);
			});
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