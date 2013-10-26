require './lib.rb'

TERM        = URI.encode "type I IFN dsRNA"
RESULTS_MAX = 1000

doc_list      = search TERM, RESULTS_MAX
doc_citations = citations 24156098

puts JSON.pretty_generate(doc_list)
puts JSON.pretty_generate(doc_citations)
