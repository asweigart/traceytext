# TraceyText by Al Sweigart (c) 2009
# http://coffeeghost.net
# This is a script for generating the necessary boilerplate HTML and JavaScript for a TraceyText display.

# * Copyright (c) 2009, Al Sweigart
# * All rights reserved.
# *
# * Redistribution and use in source and binary forms, with or without
# * modification, are permitted provided that the following conditions are met:
# *     * Redistributions of source code must retain the above copyright
# *       notice, this list of conditions and the following disclaimer.
# *     * Redistributions in binary form must reproduce the above copyright
# *       notice, this list of conditions and the following disclaimer in the
# *       documentation and/or other materials provided with the distribution.
# *     * Neither the name of the PyBat nor the
# *       names of its contributors may be used to endorse or promote products
# *       derived from this software without specific prior written permission.
# *
# * THIS SOFTWARE IS PROVIDED BY Al Sweigart ``AS IS'' AND ANY
# * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# * DISCLAIMED. IN NO EVENT SHALL Albert Sweigart BE LIABLE FOR ANY
# * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
# * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


# NOTE: I have to warn you, the parser is very finicky about accepting input.
# Check out the exact format in the "raw tracey text file format" docs, or go to
# the website for more info: http://coffeeghost.net

'''Description of the FSM the parser uses:
"general" means it is looking for optional control panel or traceytexthighlight style settings.


START --> general --> newview --> (see next row)

  +----------------------+
  V                      |
newview --+-->viewdata---+--->DONE
          |    ^
          V    |
        steporder

It's made to be fairly simple and not as verbose or flexible as XML/YAML/JSON would be for this task.
'''

import re, sys, os

patTabs = re.compile(r'\t|(    )')
patStartsWithSpaces = re.compile(r'^( )+')
patMoreThanOneSpace = re.compile(r'( )( )+')
patNewView = re.compile(r'^view\.(list|multispan|simple|append|appendscroll)\.(.*?)\.(.*)')
patNonListViewData = re.compile(r'^(\d+|default)\.(.*)') # List view data is simply interpreted as a giant string.

def usage():
    print 'TraceyText HTML Generator'
    print 'Usage:'
    print '  %s fileInRawTraceyTextFormat [-oOutputFile]' % (sys.argv[0])
    print 'If no file is specified, this program outputs to stdout.'
    print 'Al Sweigart http://coffeeghost.net (c) 2009'

def escapeJavaScript(s):
    s = patTabs.sub('&nbsp;&nbsp;&nbsp;&nbsp;', s)
    mo = patStartsWithSpaces.match(s)
    if mo is not None:
        s = patStartsWithSpaces.sub('&nbsp;' * len(mo.group(0)), s)
    mo = patMoreThanOneSpace.match(s)
    while mo is not None:
        s = patMoreThanOneSpace.sub('&nbsp;' * len(mo.group(0)), s)
        mo = patMoreThanOneSpace.match(s)

    s = s.replace('\\', '\\\\')
    s = s.replace("\'", "\\\'")
    s = s.replace('\"', '\\\"')
    s = s.replace('\n', '\\n')

    return s

def main():
    # check for proper usage
    if len(sys.argv) < 2:
        usage()
        sys.exit()
    if not os.path.exists(sys.argv[1]):
        print 'Error: Could not find the file %s' % (sys.argv[1])
        sys.exit()

    if (len(sys.argv) == 3) and (sys.argv[2].startswith('-o')):
        outputFile = sys.argv[2][2:] # grab the file name that comes after '-o'
    else:
        outputFile = None

    fp = open(sys.argv[1])
    content = fp.readlines()
    fp.close()

    parserState = 'general'
    curLineNum = 0

    insertControlPanel = False
    traceyTextHighlight = ''
    errMessage = ''

    views = [] # views are structured as tuples: {type, name, data, style} or {type, name, data, style, stepOrder} for list views.
    viewNameBuffer = ''       # temp variable used in the following loop
    viewTypeBuffer = ''       # temp variable used in the following loop
    viewStyleBuffer = ''      # temp variable used in the following loop
    viewStepOrderBuffer = ''  # temp variable used in the following loop
    viewDataBuffer = []       # temp variable used in the following loop. Contains strings for list view types, contains (slideNum, slideData) for non-list view types.
    currentViewDatum = ''

    while (curLineNum < len(content)):
        # loop through the input file's content. curLineNum must be manually incremented to progress through the file.
        line = content[curLineNum] # syntactic sugar, shorter to type

        if parserState == 'general':
            mo = patNewView.search(line)
            if mo is not None:
                parserState = 'newview'
                continue

            if line.lower().startswith('controlpanel'):
                insertControlPanel = True
            elif line.lower().startswith('traceytexthighlight'):
                traceyTextHighlight = line[len('traceytexthighlight'):]
            else:
                pass # must be a blank line or some gibberish.

            curLineNum += 1
            continue
        elif parserState == 'newview':
            mo = patNewView.search(line.strip())
            if mo is None:
                errMessage = '''Could not parse this view definition line: %s
View definition lines should look like: view.[ViewType].[IdName]
  where [ViewType] is either list, simple, multispan, append, or appendscroll and [IdName] is the text name of the HTML element for the view.''' % (line)
                break
            else:
                # Text is formatted correctly, so parse it.
                viewNameBuffer = mo.group(2)
                viewTypeBuffer = mo.group(1)
                viewStyleBuffer = mo.group(3)
                foo = mo.groups() #LEFT OFF
                viewDataBuffer = []

                if viewTypeBuffer == 'list':
                    parserState = 'steporder'
                else:
                    parserState = 'viewdata'
                curLineNum += 1
                continue
        elif parserState == 'steporder':
            viewStepOrderBuffer = line
            parserState = 'viewdata'
            currentViewDatum = '' # only used for non-list view types
            curLineNum += 1
            continue
        elif parserState == 'viewdata':
            # check if there is a newview, in which case, pack all the current view's data into the views list.
            mo = patNewView.search(line)
            if mo is not None:
                if viewTypeBuffer == 'list':
                    views.append( {'type':viewTypeBuffer, 'name':viewNameBuffer, 'data':viewDataBuffer, 'style':viewStyleBuffer, 'stepOrder':viewStepOrderBuffer} )
                else:
                    views.append( {'type':viewTypeBuffer, 'name':viewNameBuffer, 'data':viewDataBuffer, 'style':viewStyleBuffer} )
                parserState = 'newview'
                # Do not increment curLineNum here
                continue

            if viewTypeBuffer == 'list': # list view types have a viewDataBuffer that is a big string
                viewDataBuffer.append(line)
            else: # non-list view types have viewDataBuffer formatted as (slideNum, slideData)
                mo = patNonListViewData.search(line)
                if mo is None:
                    if len(viewDataBuffer) > 0: # used for slides with multi-line data, this claus handles the lines beyond the first
                        viewDataBuffer[-1] = (viewDataBuffer[-1][0], viewDataBuffer[-1][1] + '\n' + line)
                    else:
                        pass # would only be here if there is a blank line right after the view.type.name line, in which case we can just ignore it.
                else: # used for the first line of the datum
                    slideNum = mo.group(1)
                    viewDataBuffer.append( (slideNum, mo.group(2)) )
                    #print 'A DEBUG: ' + str(viewDataBuffer[-1])
            curLineNum += 1
            continue
        else:
            sys.exit('Bad parser state: %s' % (parserState))

    if errMessage != '':
        sys.exit(errMessage)

    # After we are done incrementing through the lines, we need to add the view data for the final view (the end of the file signifies the need to pack it into the views list.
    if viewTypeBuffer == 'list':
        views.append( {'type':viewTypeBuffer, 'name':viewNameBuffer, 'data':viewDataBuffer, 'style':viewStyleBuffer, 'stepOrder':viewStepOrderBuffer} )
    else:
        views.append( {'type':viewTypeBuffer, 'name':viewNameBuffer, 'data':viewDataBuffer, 'style':viewStyleBuffer} )
    # Now generate the output from the data we parsed.
    outputText = []

    if traceyTextHighlight != '':
        outputText.append('''<style type="text/css">
.traceytexthighlight {
	background-color: %s;
}
h1 {
    font-size: 24;
    font-family: Arial;
}
</style>\n''' % (traceyTextHighlight.strip()))

    ## Very basic control panel.
    #outputText.append('''<input type="button" value="prev" onclick="mainTraceyTextObj.previous()">
#<input type="button" value="next" onclick="mainTraceyTextObj.next()"><br/>
#Current Slide: <div id='curSlide'></div>''')


    for view in views:
        # Create the HTML for the <div> tags that host the views.
        outputText.append('''<div id='%s' style='%s'></div>\n''' % (view['name'], view['style']) )


    # Create the HTML and JavaScript for creating the main TraceyText object.
    outputText.append('''
<script type="text/javascript" src="TraceyText.js"></script>
<script>
var mainTraceyTextObj = new TraceyText();
''')


    for view in views:
        # Creating the JavaScript code for the view's source data.
        if view['type'] != 'list':
            # non-list view types have a 'data' key with a list of tuples for their data. (slideNum, slideData)
            tempViewData = []
            for x in view['data']:
                tempViewData.append('%s:"%s"' % (x[0], escapeJavaScript(x[1])))
            outputText.append('''%sViewData = {\n%s};\n''' % (view['name'], ', '.join(tempViewData) ) )
        else:
            # list views
            escapedText = ''.join([escapeJavaScript(x) for x in view['data']])
            outputText.append('''%sViewData = "%s";\n''' % (view['name'], escapedText) )
            outputText.append('''%sStepOrder = [%s];\n''' % (view['name'], view['stepOrder']))


    outputText.append('\n\n')



    for view in views:
        # Creating the JavaScript code that creates the TraceyTextView objects and adds them to the main TraceyText object.
        if view['type'] == 'list':
            # list view types' constructor has an extra parameter.
            outputText.append('''var viewObj%s = new TraceyTextListView('%s', %sViewData, %sStepOrder);\n''' % (view['name'], view['name'], view['name'], view['name'] ))
        else:
            if view['type'] == 'appendscroll':
                constructorSubName = 'AppendScroll'
            else:
                constructorSubName = view['type'].title() # all other types just need the first letter capitalized to match the constructor function name
            outputText.append('''var viewObj%s = new TraceyText%sView('%s', %sViewData);\n''' % (view['name'], constructorSubName, view['name'], view['name'] ))
        outputText.append('''mainTraceyTextObj.addView(viewObj%s);\n''' % (view['name']) )

    # Creating the JavaScript to add the "current slide" display.
    outputText.append('mainTraceyTextObj.addCurrentSlideDisplay("curSlide");')

    # Create the JavaScript for a floating control panel.
    if insertControlPanel:
        outputText.append('''var traceyTextFCP = new TraceyTextFloatingControlPanel('traceyTextFCP', 'mainTraceyTextObj');
traceyTextFCP.generateFloatingControlPanel();\n''')


    outputText.append('</script>')



    # Now write out everything to either stdout or the output file.
    if outputFile is None:
        print '\n'.join(outputText)
    else:
        fp = open(outputFile, 'w')
        fp.write('\n'.join(outputText))
        fp.close()





if __name__ == '__main__':
    main()
