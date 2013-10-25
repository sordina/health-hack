require 'open-uri'
require 'nokogiri'
require 'json'
require 'digest/md5'
require 'pp'

TERM        = URI.encode "type I IFN dsRNA"
RESULTS_MAX = 1000

def cache url
  filename = 'cache/' + Digest::MD5.hexdigest( url )
  if File.exists? filename
    open(filename).read
  else
    text = open(url).read
    File.open(filename,'w') do |f|
      f.write text
    end
    text
  end
end

query_result = cache "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmax=0&usehistory=y&term=#{TERM}"
parse1       = Nokogiri::XML.parse query_result
webenv       = parse1.css("WebEnv").text
querykey     = parse1.css("QueryKey").text


query2_text = cache "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=xml&query_key=#{querykey}&WebEnv=#{webenv}&retstart=0&retmax=#{RESULTS_MAX}"
parse2      = Nokogiri::XML.parse(query2_text)

doc_list = parse2.css("DocSum").map do |doc|
  top_level = [
    "Title",
    doc.css("Item[Name=Title]").text,

    "Last Author",
    doc.css("Item[Name=LastAuthor]").text,

    "authors",
    doc.css("Item[Name=Author]").map { |author|
      author.text
    },

    "Date",
    doc.css("Item[Name=PubDate]").text,

    "Journal",
    doc.css("Item[Name=FullJournalName]").text,

    "Pubmed id",
    doc.css("Id").text,

    "Pubtypes",
    doc.css("Item[Name=PubType]").map { |pt|
      pt.text
    },

    "DOI",
    doc.css("Item[Name=DOI]").text
  ]

  Hash[*top_level]
end

puts
puts JSON.pretty_generate(doc_list)
