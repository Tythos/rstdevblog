"""
"""

import os
import datetime
from docutils import utils, frontend, parsers, io, writers

MOD_ROOT, _ = os.path.split(os.path.abspath(__file__))
with open(MOD_ROOT + "/stopwords.txt", 'r') as f:
    STOPWORDS = f.read().lower().splitlines()

def getTree(rstTxt):
    """From a given RST string, parses into an abstract document tree, which is
       then returned.
    """
    RstParser = parsers.get_parser_class("rst")
    settings = frontend.OptionParser(components=(RstParser,)).get_default_values()
    doc = utils.new_document("", settings)
    psr = RstParser()
    psr.parse(rstTxt, doc)
    return doc

def debugTree(doc):
    """Returns the pseudoxml for the given document tree
    """
    so = io.StringOutput(encoding="utf8")
    WriterClass = writers.get_writer_class("pseudoxml")
    pxw = WriterClass()
    out = pxw.write(doc, so)
    return out.decode('utf8')

def getSectionKeywords(section):
    """Given a document section node, returns a list of keywords stripped of
       stop words (all lower case).
    """
    keywords = []
    for word in section.children[0].children[0].strip().lower().split():
        if word  not in STOPWORDS:
            keywords.append(word)
    return keywords

def getDocKeywords(doc, nWords=5):
    """Grabs keywords (after stopwords are stripped), then sorts by frequency
       and returns the top five. (Can be overridden.)
    """
    topSection = doc.children[0]
    keywords = getSectionKeywords(topSection)
    for child in topSection.children:
        if child.tagname == "section":
            keywords += getSectionKeywords(child)
    uniques = list(set(keywords))
    occurances = [0] * len(uniques)
    for keyword in keywords:
        ndx = uniques.index(keyword)
        occurances[ndx] += 1
    sorter = lambda word: occurances[uniques.index(word)]
    ordered = sorted(uniques, key=sorter, reverse=True)
    return ordered[:min(nWords,len(ordered))]

def getMeta(rstPath):
    """Metadata includes:
        * name, the filename without extension by which the article is
          identified
        * title, the string value of the top-level section in the document tree
        * keywords, as parsed from first- and second-level section titles
          (stripped of stopwords)
        * date (datetime.datetime value of last-modified property of file)
    """
    with open(rstPath, 'r') as f:
        rstTxt = f.read()
    _, fileName = os.path.split(rstPath)
    name, _ = os.path.splitext(fileName)
    doc = getTree(rstTxt)
    text = doc.children[0].children[0].children[0]
    title = text.strip()
    sr = os.stat(rstPath)
    dt = datetime.datetime.utcfromtimestamp(sr.st_ctime)
    date = round(dt.timestamp() * 1e3)
    keywords = getDocKeywords(doc)
    return {
        "name": name,
        "title": title,
        "date": date,
        "keywords": keywords
    }
