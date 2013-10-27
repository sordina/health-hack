require './lib.rb'

term        = URI.encode( ARGV[0] || "type I IFN dsRNA" )
results_max = ARGV[1].to_i || 100
query       = meta_search term
doc_list    = search query[:webenv], query[:querykey], results_max
geostuff    = convert_geojson doc_list
text        = JSON.pretty_generate(doc_list)

puts "Outputting JSON:"
puts

File.open("json/#{term}__#{results_max}_results.json", "w") do |f|
  print "."
  f.write text
end

puts
