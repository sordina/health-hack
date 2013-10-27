
require 'open-uri'
require 'nokogiri'
require 'json'
require 'digest/md5'
require 'pp'

def cache url
  filename = 'cache/' + Digest::MD5.hexdigest( url )
  if File.exists? filename
    puts "cache hit #{url}"
    open(filename).read
  else
    puts "cache miss #{url}"
    text = open(url).read
    File.open(filename,'w') do |f|
      f.write text
    end
    text
  end
end

def geocode institution
  # https://developers.google.com/maps/documentation/geocoding/ - Docs
  text = cache "https://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=#{URI.encode institution}"
  JSON.parse text
end

def parse_citation c
  title     = c.css('.title a').text
  pubmed_id = c.css('.aux dd').first.text
  authors   = c.css('.supp .desc').first.text.split(/\s*,\s*/)
  {:title       => title,
   :id          => pubmed_id,
   :authors     => authors,
   :last_author => authors.last}
end

def citations pubmed_id, page = 0
  query_result = cache "http://www.ncbi.nlm.nih.gov/pubmed?linkname=pubmed_pubmed&from_uid=#{pubmed_id}"
  doc = Nokogiri::HTML.parse query_result
  pages = doc.xpath '//*[@id="maincontent"]/div/div[3]/div[2]/h2'
  pages.text =~ /Results: (\d+) to (\d+) of (\d+)/
  f, l, t = $1.to_i, $2.to_i, $3.to_i

  results = doc.css(".rslt")
  {:results => t, :first => f, :last => l, :citations => results.map {|c| parse_citation c } }
end

def meta_search term
  query_result = open( "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmax=0&usehistory=y&term=#{term}" ).read
  parse1       = Nokogiri::XML.parse query_result
  webenv       = parse1.css("WebEnv").text
  querykey     = parse1.css("QueryKey").text

  {:webenv => webenv, :querykey => querykey}
end

def info_search pubmed_id
  text = cache "http://www.ncbi.nlm.nih.gov/pubmed/#{pubmed_id}"
  doc = Nokogiri::HTML.parse text
  institution = doc.css('.aff p').text
  abstract = doc.css('.abstr p').text
  first_institution = institution.lines.first
  if first_institution && first_institution.length < 400
    {:institution => institution, :abstract => abstract, :location => geocode(first_institution) }
  else
    nil
  end
end

def search webenv, querykey, results_max
  query2_text = cache "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=xml&query_key=#{querykey}&WebEnv=#{webenv}&retstart=0&retmax=#{results_max}"
  parse2      = Nokogiri::XML.parse(query2_text)

  doc_list = parse2.css("DocSum").map do |doc|

    pubmed_id = doc.css("Id").text

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
      pubmed_id,

      "Pubtypes",
      doc.css("Item[Name=PubType]").map { |pt|
        pt.text
      },

      "DOI",
      doc.css("Item[Name=DOI]").text,

      "Citations",
      citations(pubmed_id),

      "Info",
      info_search(pubmed_id)
    ]

    Hash[*top_level]
  end
end

def convert_geojson list
  list.map do |h|

    begin
      foo = h["Info"][:location]["results"].first["geometry"]["location"]
      { "type" => "FeatureCollection",
        "features" => [
          { "type" => "Feature",
            "properties" => {"title" => h["Title"], "pubmed_id" => h["Pubmed id"] },
            "geometry" => {"type" => "Point", "coordinates" => [foo["lat"], foo["lng"]]},
          }
        ]
      }
    rescue Exception => e
      nil
    end
  end
end
