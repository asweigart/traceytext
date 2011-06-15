// TraceyText by Al Sweigart (c) 2009
// http://coffeeghost.net
// This is a JavaScript library to help create visualizations and textual/HTML slide shows across multiple "view ports" in a way that minimizes file size.

// * Copyright (c) 2009, Al Sweigart
// * All rights reserved.
// *
// * Redistribution and use in source and binary forms, with or without
// * modification, are permitted provided that the following conditions are met:
// *     * Redistributions of source code must retain the above copyright
// *       notice, this list of conditions and the following disclaimer.
// *     * Redistributions in binary form must reproduce the above copyright
// *       notice, this list of conditions and the following disclaimer in the
// *       documentation and/or other materials provided with the distribution.
// *     * Neither the name of the PyBat nor the
// *       names of its contributors may be used to endorse or promote products
// *       derived from this software without specific prior written permission.
// *
// * THIS SOFTWARE IS PROVIDED BY Al Sweigart ``AS IS'' AND ANY
// * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// * DISCLAIMED. IN NO EVENT SHALL Albert Sweigart BE LIABLE FOR ANY
// * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


// TODO - Current TraceyText cannot control views located on other slides.

var TraceyText = function ()
{
	// This is a constructor for creating TraceyText objects.
	// A TraceyText object can contain multiple view objects, and provides a mean for updating all of the views to the same slide.

	this.currentSlide = 1; // default start slide is slide #1
	this.maxSlide = 1;     // this value changes as more views are added.
	this.views = new Array();       // the views contained in this TraceyText object. Starts off with no views. Add them with "addView()"
	this.currentSlideDisplays = new Array();		// an array of strings for element ids which should have their inner html updated to the current slide number.

	this.getCurrentSlideNumber = function()
	{
		return this.currentSlide;
	}

	this.addView = function (viewObject)
	{
		var viewType = viewObject.viewType; // syntactic sugar for less typing
		var viewData = viewObject.viewData; // syntactic sugar for less typing

		// Adds a view object to this TraceyText object.
		// View objects within the same TraceyText object will always display the same slide number.
		if (viewType == 'list')
		{
			this.views.push(viewObject);
			this.maxSlide = Math.max(this.maxSlide, viewObject.stepOrder.length); // Sets a new this.maxSlide depending on number of "steps" in the list view.
		}
		else 
		{
			// All the other view types don't have any additional code that needs to be run before/after being added to this.views
			if ((viewType == 'multispan') || (viewType == 'append') || (viewType == 'simple') || (viewType == 'appendscroll'))
			{
				this.views.push(viewObject);
			}
			else
			{
				// TODO - What to do if sent an invalid view type?
			}

			// Setting a new this.maxSlide depending on the number of slides in the view.
			for (ind in viewData) // Use the actual numeric index, not simply the length of viewData. This is because we could have holes, like 1:x, 2:x, 4:x <-- should set to 4, whereas length would only be 3.
			{
				if (!isNaN(ind))
				{
					this.maxSlide = Math.max(this.maxSlide, ind);
				}
			}
		}


		// adjust the newly added view's element to the current slide.
		this.jump(this.currentSlide);
	}

	this.addCurrentSlideDisplay = function (elementName)
	{
		// Registers an element name to update the innerHTML to simply the number of the current slide whenever this TraceyText object changes slides.
		this.currentSlideDisplays.push(elementName);

		// adjust the newly added current slide display's element to the current slide.
		this.jump(this.currentSlide);
	}

	this.next = function()
	{
		// Control panels should call this to move all of the TraceyText object's views to the next slide.
		// Returns nothing, the only side effect is changing the value of this.currentSlide
		if (this.currentSlide == this.maxSlide) return;
		this.changeToSlide(this.currentSlide + 1);
	}

	this.previous = function()
	{
		// Control panels should call this to move all of the TraceyText object's views to the previous slide.
		if (this.currentSlide == 1) return;
		this.changeToSlide(this.currentSlide - 1);
	}

	this.jump = function(slideNum)
	{
		// Control panels should call this to set all of the TraceyText object's views to a certain slide.
		slideNum = parseInt(slideNum, 10);
		if (slideNum < 1) 
		{
			slideNum = 1;
		}
		if (slideNum > this.maxSlide) 
		{
			slideNum = this.maxSlide;
		}
		this.changeToSlide(slideNum);
	}

	this.changeToSlide = function(slideNum)
	{
		// Updates all of this TraceyText object's views' slides to a certain slide number.
		// Go through all the view objects in this TraceyText object that were added with addView().
		if (isNaN(slideNum))
		{
			return; // TODO - how to handle this failure case?
		}

		this.currentSlide = slideNum;

		for (viewIndex in this.views)
		{
			elem = document.getElementById(this.views[viewIndex].viewElementName);
			if (elem != undefined)
			{
				elem.innerHTML = this.views[viewIndex].getSlide(slideNum);

				// appendscroll view types will scroll to the bottom of the div tag when the content changes.
				if (this.views[viewIndex].viewType == 'appendscroll')
				{
					elem.scrollTop = elem.scrollHeight;
				}
				// Scroll the div down if its scrollsDownOnNewSlide member is true
				// To make effective use of this, set the display div's style to width:100px;height:200px;overflow:auto; or similar.
				// TODO - Commenting this out until I get this feature to work.
				//if (this.views[viewIndex].scrollsDownOnNewSlide == true) // scroll the div to the bottom.
				//{
				//	this.views[viewIndex].scrollTop = this.views[viewIndex].scrollHeight;
				//}
			}
			else
			{
				// TODO - not sure what to do if the element does not exist. Currently it just silently does nothing.
			}
		}

		// Update the "current slide" displays
		for (displayIndex in this.currentSlideDisplays)
		{
			elem = document.getElementById(this.currentSlideDisplays[displayIndex]);
			if (elem != undefined)
			{
				elem.innerHTML = this.currentSlide;
			}
			else
			{
				// TODO - not sure what to do if the element does not exist. Currently it just silently does nothing.
			}
		}
	}
}

var TraceyTextFloatingControlPanel = function(selfName, traceyTextName)
{
	this.floatX=10;
	this.floatY=10;

	this.selfName = selfName;
	this.traceyTextName = traceyTextName; // name of the TraceyText object that this control panel controls.

	this.NS6 = false;
	this.IE4 = (document.all);
	if (!this.IE4) 
	{
		this.NS6 = (document.getElementById);
	}
	this.NS4 = (document.layers);

	this.adjustFloatingControlPanel = function() 
	{
		if ((this.NS4) || (this.NS6)) 
		{
			this.lastX = window.pageXOffset + this.floatX;
			this.lastY = window.pageYOffset + this.floatY;
			
			if (this.NS4)
			{
				document.layers['floatlayer'].pageX = this.lastX;
				document.layers['floatlayer'].pageY = this.lastY;
			}
			if (this.NS6)
			{
				document.getElementById('floatlayer').style.left = this.lastX;
				document.getElementById('floatlayer').style.top = this.lastY;
			}
		}
		else if (this.IE4)
		{
			this.lastX = document.body.scrollLeft + this.floatX;
			this.lastY = document.body.scrollTop + this.floatY;
			document.all['floatlayer'].style.posLeft = this.lastX;
			document.all['floatlayer'].style.posTop = this.lastY;
		}
		setTimeout(this.selfName + '.adjustFloatingControlPanel();' ,50);
	}

	this.defineFloatingControlPanel = function()
	{
		if ((this.NS4) || (this.NS6))
		{
			this.floatX = this.ifloatX;
			this.floatY = this.ifloatY;
		}
		if (this.IE4)
		{
			this.floatX = this.ifloatX;
			this.floatY = this.ifloatY;
		}
	}

	this.generateFloatingControlPanel = function(controlPanelHTML)
	{
		// TODO - Need to allow the user to customize the placement of the floating control panel. Right now it only appears in the top-left corner.
		if (this.traceyTextName == undefined)
		{
			return; // TODO - come up with error handling case if the traceyTextName is invalid.
		}
		
		if (this.NS4) 
		{
			document.write('<LAYER NAME="floatlayer" LEFT="' + this.floatX + '" TOP="' + this.floatY + '">');
		}
		if ((this.IE4) || (this.NS6)) 
		{
			document.write('<div id="floatlayer" style="background-color:CCCCCC; padding:6px; position:absolute; left:' + this.floatX + '; top:' + this.floatY + ';">');
		}

		// Write out the HTML for the actual control panel.
		if ((controlPanelHTML == undefined) || (controlPanelHTML == false))
		{
			// Use the default control panel.
			document.write('<span style=\'background-color:CCCCCC;\'><center><input type=\'button\' value=\'Previous\' onClick=\'' + this.traceyTextName + '.previous()\'>	<input type=\'button\' value=\'Next\' onClick=\'' + this.traceyTextName + '.next()\'> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type=\'text\' id=\'traceyTextJumpTextfield\' size=\'3\' value=\'1\'> <input type=\'button\' value=\'Jump\' onClick=\'' + this.traceyTextName + '.jump(document.getElementById(\"traceyTextJumpTextfield\").value);\'>	&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Step #<span id=\"traceyTextFloatingDisplay\"></span></center></span>');
			eval(this.traceyTextName + ".addCurrentSlideDisplay('traceyTextFloatingDisplay');");
		}
		else
		{
			// Let the user specify the HTML that is used for the contol panel.
			document.write(controlPanelHTML);
		}
		
		if (this.NS4)
		{
			document.write('</LAYER>');
		}
		if ((this.IE4) || (this.NS6))
		{
			document.write('</DIV>');
		}
		this.ifloatX = this.floatX;
		this.ifloatY = this.floatY;
		this.defineFloatingControlPanel();
		window.onresize = this.defineFloatingControlPanel;
		this.lastX = -1;
		this.lastY = -1;
		this.adjustFloatingControlPanel();		
	}
}


var TraceyTextListView = function (viewElementName, viewData, stepOrder)
{
	// TODO - bad oop design to not use inheritance for TraceyTextListView, TraceyTextSimpleView, etc. But it works.
	// Don't call this constructor yourself, always use TraceyText.addView().

	// The List view type is the only view type that has viewData as a giant string (the html with <li> tags) instead of an array of slide:string.
	this.viewElementName = viewElementName;
	this.viewType = 'list';
	this.viewData = viewData;
	this.stepOrder = stepOrder;
	this.scrollsDownOnNewSlide = false; // This must be manually set to true after calling TraceyText.addView()

	this.getSlide = function(slideNum)
	{	
		liTagToHightlight = this.stepOrder[slideNum-1]; // translate the slide number to the <li> tag we will highlight. slideNum-1 because the user submits a 0-indexed array for stepOrder.
		if (liTagToHightlight == undefined)
		{
			return this.viewData; // if there is no step, then return the viewData without any highlight changes.
		}
		else
		{
			// Takes the view data for a "list" view type and inserts HTML for highlighting at a certain point in the string (given by index).
			//alert(this.viewData.substring(0, this.viewLiIndexes[liTagToHightlight]) + ' class="traceytexthighlight"' + this.viewData.substring(this.viewLiIndexes[liTagToHightlight], this.viewData.length));
			return this.viewData.substring(0, this.viewLiIndexes[liTagToHightlight]) + ' class="traceytexthighlight"' + this.viewData.substring(this.viewLiIndexes[liTagToHightlight], this.viewData.length);
		}
	}

	this.translateLiTagsToIndexes = function (sourceCode)
	{
		// Returns an array of all the indexes in sourceCode where a <li> tag starts. Used for List Views.
		sourceCode = sourceCode.toLowerCase();
		var arrOfIndexes = new Array();
		arrOfIndexes[0] = 0; // One-off adjustment for readability. This way slide 1 is at arrOfIndexes[1] instead of arrOfIndexes[0].

		var ind = 0;
		while (ind > -1)
		{
			ind = sourceCode.indexOf("<li>"); // find the first <li>
			if (ind > -1)
			{
				arrOfIndexes.push(ind + 3);
			}
			sourceCode = sourceCode.replace("<li>","XXXX"); // temporarily get rid of the first <li>, so that the next <li> becomes the new first <li>
		}
		return arrOfIndexes;
	}

	this.viewLiIndexes = this.translateLiTagsToIndexes(this.viewData);
}

var TraceyTextMultispanView = function (viewElementName, viewData)
{
	// TODO - bad oop design to not use inheritance for TraceyTextListView, TraceyTextSimpleView, etc. But it works.
	// Don't call this constructor yourself, always use TraceyText.addView().
	this.viewElementName = viewElementName;
	this.viewType = 'multispan';
	this.viewData = viewData;
	this.scrollsDownOnNewSlide = false; // This must be manually set to true after calling TraceyText.addView()

	this.getSlide = function(slideNum)
	{
		slideToUse = slideNum;
		while (this.viewData[slideToUse] == undefined)
		{
			slideToUse -= 1;
			if (slideToUse <= 0) return "";
		}
		return this.viewData[slideToUse];
	}
}


var TraceyTextAppendView = function (viewElementName, viewData)
{
	// TODO - bad oop design to not use inheritance for TraceyTextListView, TraceyTextSimpleView, etc. But it works.
	// Don't call this constructor yourself, always use TraceyText.addView().
	this.viewElementName = viewElementName;
	this.viewType = 'append';
	this.viewData = viewData;
	this.scrollsDownOnNewSlide = false; // This must be manually set to true after calling TraceyText.addView()

	this.getSlide = function(slideNum)
	{
		var retVal = '';
		for (i = 0 ; i <= slideNum ; i++)
		{
			if (this.viewData[i] != undefined)
			{
				retVal += this.viewData[i];
			}
		}
		return retVal;
	}
}

var TraceyTextAppendScrollView = function (viewElementName, viewData)
{
	// TODO - bad oop design to not use inheritance for TraceyTextListView, TraceyTextSimpleView, etc. But it works.
	// Don't call this constructor yourself, always use TraceyText.addView().
	this.viewElementName = viewElementName;
	this.viewType = 'appendscroll';
	this.viewData = viewData;
	this.scrollsDownOnNewSlide = false; // This must be manually set to true after calling TraceyText.addView()

	this.getSlide = function(slideNum)
	{
		var retVal = '';
		for (i = 0 ; i <= slideNum ; i++)
		{
			if (this.viewData[i] != undefined)
			{
				retVal += this.viewData[i];
			}
		}
		return retVal;
	}
}

var TraceyTextSimpleView = function (viewElementName, viewData)
{
	// TODO - bad oop design to not use inheritance for TraceyTextListView, TraceyTextSimpleView, etc. But it works.
	// Don't call this constructor yourself, always use TraceyText.addView().
	this.viewElementName = viewElementName;
	this.viewType = 'simple';
	this.viewData = viewData;
	this.scrollsDownOnNewSlide = false; // This must be manually set to true after calling TraceyText.addView()

	this.getSlide = function(slideNum)
	{
		if (this.viewData[slideNum] == undefined)
		{
			if (this.viewData['default'] != undefined) // no data for this slide but we have a "default" slide
			{
				return this.viewData['default'];
			}
			else // no data for this slide and no default, return a blank string
			{
				return '';
			}
		}
		else
		{
			return this.viewData[slideNum];
		}
	}
}