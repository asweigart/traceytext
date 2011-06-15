http://traceytext.coffeeghost.net


What is TraceyText?

TraceyText is an HTML-based teaching tool for visualizing single-stepping through source code. TraceyText can also double as a text/HTML slideshow library implemented in JavaScript. With TraceyText's features, you can create web pages with a text or HTML slideshow and TraceyText will minimize the file size. TraceyText can also combine multiple "views" in the same slideshow to adjust in sync with each other.

The best way to understand what TraceyText is and what its capabilities are is to see it in action. Check out the demos.
When is TraceyText Useful?

TraceyText is a useful tool for visualizing source code debugging or any presentation with animated text. TraceyText can also be used as an ordinary web picture slideshow as well. TraceyText has an API which opens itself to user-created JavaScript as well. TraceyText's name comes from its original purpose as a way to demonstrate debugging traces through source code.
Terminology and The Different View Types

A TraceyText object implements a single "slideshow", which has a sequential series of "slides". Each slide contains text and HTML that will be displayed to the user in a "view". A view is usually implemented as a <div> or <span> tag whose inner HTML is set to the slide text or HTML. There can be multiple views associated with a single slideshow, and all the views will be updated to new slides simulataneously as the user navigates to the next or previous slide.

For example, an art gallery slideshow may have two views. One view can be used to display the HTML for each image in the gallery, and the second view can be used for accompanying text descriptions for the image. By using two views, we can place the two views in different areas of the web page. TraceyText can handle an unlimited number of simultaneous slide shows and views.

To minimize the web page size, TraceyText offers four different types of views:

    * Simple - The simple view has a one to one mapping of slide number to text. This is useful when each slide in the slideshow is expected to have completely different text, and offers no compression benefits.
    * Multispan - The multispan view is used when the text on a slide persists across multiple slides and only updates at a later slide. For example, if the text "Introduction" is the text for the first five slides, then a multispan view allows you to specify it once and use it until the sixth slide is displayed.
    * Append - The append view is used when the text for a slide should be added to the end of the text of all the previous slides. For example, the first slide shows the text for the first slide. But the second slide shows the text from the first slide followed by the second slide's text. The third slide shows the text from the first, second, and then third slide, and so on.
    * List - The list view is useful for slides that contain HTML lists. This view lets you specify <li> elements in the HTML list to highlight for different slides. This is the view type used in the source code debugging demos to highlight specific lines of code. However, it can be used for any slideshow that uses HTML lists.

Display Counter

The display counter is a <div> or <span> tag whose inner HTML will be set to the current slide number.
Floating Control Panel

Using the TraceyText API, it is easy to connect HTML buttons or JavaScript actions to change the slide to the next or previous slide. However, TraceyText comes with a floating control panel with Next, Previous, and Jump To buttons for slide control which will hover in the top left corner of the screen, even if the user scrolls up or down the web page.
The TraceyText API

The TraceyText API makes it easy to programmatically create and control slide shows. See the TraceyText API Reference for details.
The Raw TraceyText Format and Python Script

For easy creation of complicated slideshows, you can type the slideshow data into a simple format call the Raw TraceyText Format. TraceyText includes a Python script (and an executable version of the script) which converts the Raw TraceyText Format into the necessary JavaScript code to create the TraceyText slideshow.
Examples

You can view examples of the raw TraceyText format, the basic JavaScript the raw format produces, and completed TraceyText slideshows on the demo page.