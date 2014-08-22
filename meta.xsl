<?xml version="1.0"?>
<xsl:stylesheet version="1.0"
                xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" 
                xmlns:em="http://www.mozilla.org/2004/em-rdf#"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<!--
  <xsl:output method="xml" indent="yes" encoding="utf-8"/>
-->
  <xsl:output indent="yes" encoding="utf-8" omit-xml-declaration="yes"/>

  <xsl:param name="extname" select="'wps'"/>

  <xsl:template match="/xsl:*|/install.rdf">
    <rdf:RDF>
      <rdf:Description about="urn:mozilla:install-manifest">
        <em:id>wps@cmu.edu</em:id>
        <em:type>2</em:type>
        <em:name>WPS</em:name>
        <em:version>0.0.1</em:version>
        <em:creator>Your Name Here</em:creator>
        <em:optionsURL>
          <xsl:text>chrome://</xsl:text><xsl:value-of select="$extname"/><xsl:text>/content/xul/options.xul</xsl:text>
        </em:optionsURL>
        <em:targetApplication>
          <rdf:Description>
            <em:id>{ec8030f7-c20a-464f-9b0e-13a3a9e97384}</em:id> 
            <em:minVersion>3.0</em:minVersion>
            <em:maxVersion>28.0.*</em:maxVersion> 
          </rdf:Description>
        </em:targetApplication>
        <em:strictCompatibility>false</em:strictCompatibility>
        <xsl:comment>
          don't sweat the maxVersion; see 
          https://developer.mozilla.org/en-US/docs/Install_Manifests#strictCompatibility
        </xsl:comment>
        <em:bootstrap>true</em:bootstrap>
      </rdf:Description>
    </rdf:RDF>
  </xsl:template>

  <xsl:template match="/chrome.manifest">
    <xsl:text>content      </xsl:text>
    <xsl:value-of select="$extname"/>
    <xsl:text> content/     </xsl:text>
    <xsl:text>&#10;</xsl:text>
    <xsl:text>skin         </xsl:text>
    <xsl:value-of select="$extname"/>
    <xsl:text> classic/1.0  </xsl:text>
    <xsl:text>skin/        </xsl:text>
    <xsl:text>&#10;</xsl:text>
    <xsl:text>locale       </xsl:text>
    <xsl:value-of select="$extname"/>
    <xsl:text> en-US        </xsl:text>
    <xsl:text>locale/en-US/</xsl:text>
    <xsl:text>&#10;</xsl:text>
  </xsl:template>

  <xsl:template match="/|*|@*|text()|node()" priority="-100">
    <xsl:copy>
      <xsl:apply-templates select="@*"/>
      <xsl:apply-templates select="node()"/>
    </xsl:copy>	
  </xsl:template>
</xsl:stylesheet>
