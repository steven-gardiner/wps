
all: install.rdf chrome.manifest content/lib/jquery-2.1.1.min.js

content/lib/jquery-%.js: 
	mkdir -p content/lib
	echo $(notdir $@)
	curl http://code.jquery.com/$(notdir $@) > $@

install.rdf: meta.xsl
	echo "<install.rdf/>" | xsltproc $< - > $@

chrome.manifest: meta.xsl
	echo "<chrome.manifest/>" | xsltproc $< - > $@
